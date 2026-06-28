import http from "http";
import { io as ioClient } from "socket.io-client";
import { initSocket } from "./socket/index";

const PORT = 3005;
const SERVER_URL = `http://localhost:${PORT}`;

// 1. Create a raw HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Test Server");
});

// 2. Initialize socket.io using the server's initialization function
initSocket(server);

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`📡 Temporary Test Server running on ${SERVER_URL}`);
    console.log(`======================================================\n`);
    runTests();
});

function runTests() {
    console.log("🚀 Starting Socket.IO Integration Tests...\n");

    let client1Connected = false;
    let client2Connected = false;

    // Track test checkpoints
    let joinRoomVerified = false;
    let privateChatClient2Received = false;
    let privateChatClient1Received = false;
    let offerVerified = false;
    let answerVerified = false;
    let iceCandidate2Verified = false;
    let iceCandidate1Verified = false;
    let leaveRoomVerified = false;

    // Connect Client 1 (User 1)
    const client1 = ioClient(SERVER_URL, {
        transports: ["websocket"],
        auth: { userId: "user-1" },
        reconnection: false
    });

    // Connect Client 2 (User 2)
    const client2 = ioClient(SERVER_URL, {
        transports: ["websocket"],
        auth: { userId: "user-2" },
        reconnection: false
    });

    const cleanup = (exitCode: number) => {
        console.log("\n🧹 Cleaning up clients and server...");
        client1.disconnect();
        client2.disconnect();
        server.close(() => {
            console.log("🛑 Server stopped.");
            console.log(`======================================================`);
            process.exit(exitCode);
        });
    };

    // Set a timeout of 12 seconds to prevent hanging
    const timeout = setTimeout(() => {
        console.error("\n❌ Test timed out! Some assertions were not met.");
        console.log(`\n📊 Test Execution Report:`);
        console.log(`- Connection Client 1: ${client1Connected ? "✅ Success" : "❌ Failed"}`);
        console.log(`- Connection Client 2: ${client2Connected ? "✅ Success" : "❌ Failed"}`);
        console.log(`- Room Join Event:     ${joinRoomVerified ? "✅ Success" : "❌ Failed"}`);
        console.log(`- Private Chat (1->2):  ${privateChatClient2Received ? "✅ Success" : "❌ Failed"}`);
        console.log(`- Private Chat (2->1):  ${privateChatClient1Received ? "✅ Success" : "❌ Failed"}`);
        console.log(`- WebRTC Offer (1->2):  ${offerVerified ? "✅ Success" : "❌ Failed"}`);
        console.log(`- WebRTC Answer (2->1): ${answerVerified ? "✅ Success" : "❌ Failed"}`);
        console.log(`- ICE Candidate (1->2): ${iceCandidate2Verified ? "✅ Success" : "❌ Failed"}`);
        console.log(`- ICE Candidate (2->1): ${iceCandidate1Verified ? "✅ Success" : "❌ Failed"}`);
        console.log(`- Room Leave Event:    ${leaveRoomVerified ? "✅ Success" : "❌ Failed"}`);
        cleanup(1);
    }, 12000);

    // Connection handlers
    client1.on("connect", () => {
        console.log(`✅ Connection OK: Client 1 (Socket ID: ${client1.id}, User ID: user-1)`);
        client1Connected = true;
        checkConnections();
    });

    client1.on("connect_error", (err) => {
        console.error("❌ Client 1 connection error:", err.message);
        cleanup(1);
    });

    client2.on("connect", () => {
        console.log(`✅ Connection OK: Client 2 (Socket ID: ${client2.id}, User ID: user-2)`);
        client2Connected = true;
        checkConnections();
    });

    client2.on("connect_error", (err) => {
        console.error("❌ Client 2 connection error:", err.message);
        cleanup(1);
    });

    function checkConnections() {
        if (client1Connected && client2Connected) {
            console.log("\n🔗 Both clients connected! Starting step-by-step test flow...\n");
            startRoomJoinTest();
        }
    }

    const ROOM_ID = "test-room-abc";

    // --- STEP 1: Test Room Joining ---
    function startRoomJoinTest() {
        console.log("------------------------------------------------------");
        console.log("🧪 TEST STEP 1: testing join_room & user-joined broadcast");
        console.log("------------------------------------------------------");

        client1.on("user-joined", (data: any) => {
            console.log("📢 [Client 1] Received 'user-joined':", data);
            if (data && data.userId === "user-2") {
                console.log("✅ SUCCESS: Client 1 was correctly notified that User 2 joined.");
                joinRoomVerified = true;
                client1.off("user-joined"); // Clean up listener
                
                // Move to next step
                setTimeout(startPrivateChatTest, 800);
            }
        });

        console.log(`[Client 1] Emitting join_room for '${ROOM_ID}'...`);
        client1.emit("join_room", ROOM_ID);

        setTimeout(() => {
            console.log(`[Client 2] Emitting join_room for '${ROOM_ID}'...`);
            client2.emit("join_room", ROOM_ID);
        }, 300);
    }

    // --- STEP 2: Test Private Chat ---
    function startPrivateChatTest() {
        console.log("\n------------------------------------------------------");
        console.log("🧪 TEST STEP 2: testing privateChat routing (bidirectional)");
        console.log("------------------------------------------------------");

        // Client 2 listens for message from Client 1
        client2.on("privateChat", (data: any) => {
            console.log("📢 [Client 2] Received 'privateChat':", data);
            if (data && data.from === "user-1" && data.message === "Hello user-2! How are you?") {
                console.log("✅ SUCCESS: Client 2 successfully received private chat from Client 1.");
                privateChatClient2Received = true;
                client2.off("privateChat");

                // Client 2 replies back to Client 1
                console.log("[Client 2] Replying with private chat to user-1...");
                client2.emit("privateChat", { userId: "user-1", message: "Hey user-1! Doing great!" });
            }
        });

        // Client 1 listens for reply from Client 2
        client1.on("privateChat", (data: any) => {
            console.log("📢 [Client 1] Received 'privateChat' reply:", data);
            if (data && data.from === "user-2" && data.message === "Hey user-1! Doing great!") {
                console.log("✅ SUCCESS: Client 1 successfully received reply from Client 2.");
                privateChatClient1Received = true;
                client1.off("privateChat");

                // Move to WebRTC signaling tests
                setTimeout(startWebRTCOfferTest, 800);
            }
        });

        console.log("[Client 1] Sending private chat to user-2...");
        client1.emit("privateChat", { userId: "user-2", message: "Hello user-2! How are you?" });
    }

    // --- STEP 3: Test WebRTC Offer ---
    function startWebRTCOfferTest() {
        console.log("\n------------------------------------------------------");
        console.log("🧪 TEST STEP 3: testing WebRTC offer routing");
        console.log("------------------------------------------------------");

        const testOffer = { sdp: "v=0\no=- 42938 2 IN IP4 127.0.0.1...", type: "offer" };

        client2.on("offer", (data: any) => {
            console.log("📢 [Client 2] Received 'offer':", data);
            if (data && data.from === "user-1" && data.offer.sdp === testOffer.sdp) {
                console.log("✅ SUCCESS: Client 2 successfully received WebRTC offer from Client 1.");
                offerVerified = true;
                client2.off("offer");

                // Move to WebRTC Answer test
                setTimeout(startWebRTCAnswerTest, 800);
            }
        });

        console.log("[Client 1] Emitting WebRTC offer for user-2...");
        client1.emit("offer", { userId: "user-2", offer: testOffer });
    }

    // --- STEP 4: Test WebRTC Answer ---
    function startWebRTCAnswerTest() {
        console.log("\n------------------------------------------------------");
        console.log("🧪 TEST STEP 4: testing WebRTC answer routing");
        console.log("------------------------------------------------------");

        const testAnswer = { sdp: "v=0\no=- 98765 2 IN IP4 127.0.0.1...", type: "answer" };

        client1.on("answer", (data: any) => {
            console.log("📢 [Client 1] Received 'answer':", data);
            if (data && data.from === "user-2" && data.answer.sdp === testAnswer.sdp) {
                console.log("✅ SUCCESS: Client 1 successfully received WebRTC answer from Client 2.");
                answerVerified = true;
                client1.off("answer");

                // Move to WebRTC ICE Candidate test
                setTimeout(startWebRTCICECandidateTest, 800);
            }
        });

        console.log("[Client 2] Emitting WebRTC answer for user-1...");
        client2.emit("answer", { userId: "user-1", answer: testAnswer });
    }

    // --- STEP 5: Test WebRTC ICE Candidate ---
    function startWebRTCICECandidateTest() {
        console.log("\n------------------------------------------------------");
        console.log("🧪 TEST STEP 5: testing WebRTC iceCandidate routing (bidirectional)");
        console.log("------------------------------------------------------");

        const candidate1 = { candidate: "candidate:1 1 UDP 2130706431 127.0.0.1 5000 typ host", sdpMid: "0", sdpMLineIndex: 0 };
        const candidate2 = { candidate: "candidate:2 1 UDP 2130706431 127.0.0.1 6000 typ host", sdpMid: "0", sdpMLineIndex: 0 };

        // Client 2 listens for candidate from Client 1
        client2.on("iceCandidate", (data: any) => {
            console.log("📢 [Client 2] Received 'iceCandidate':", data);
            if (data && data.from === "user-1" && data.candidate.candidate === candidate1.candidate) {
                console.log("✅ SUCCESS: Client 2 successfully received ICE candidate from Client 1.");
                iceCandidate2Verified = true;
                client2.off("iceCandidate");

                // Client 2 sends back candidate to Client 1
                console.log("[Client 2] Emitting ICE candidate for user-1...");
                client2.emit("iceCandidate", { userId: "user-1", candidate: candidate2 });
            }
        });

        // Client 1 listens for candidate from Client 2
        client1.on("iceCandidate", (data: any) => {
            console.log("📢 [Client 1] Received 'iceCandidate' reply:", data);
            if (data && data.from === "user-2" && data.candidate.candidate === candidate2.candidate) {
                console.log("✅ SUCCESS: Client 1 successfully received ICE candidate from Client 2.");
                iceCandidate1Verified = true;
                client1.off("iceCandidate");

                // Move to Room Leave test
                setTimeout(startRoomLeaveTest, 800);
            }
        });

        console.log("[Client 1] Emitting ICE candidate for user-2...");
        client1.emit("iceCandidate", { userId: "user-2", candidate: candidate1 });
    }

    // --- STEP 6: Test Room Leaving ---
    function startRoomLeaveTest() {
        console.log("\n------------------------------------------------------");
        console.log("🧪 TEST STEP 6: testing leave_room & user-left broadcast");
        console.log("------------------------------------------------------");

        client1.on("user-left", (data: any) => {
            console.log("📢 [Client 1] Received 'user-left':", data);
            if (data && data.userId === "user-2") {
                console.log("✅ SUCCESS: Client 1 was correctly notified that User 2 left.");
                leaveRoomVerified = true;
                client1.off("user-left");

                // Wrap up and print final report
                finishTests();
            }
        });

        console.log(`[Client 2] Emitting leave_room for '${ROOM_ID}'...`);
        client2.emit("leave_room", ROOM_ID);
    }

    function finishTests() {
        clearTimeout(timeout);
        console.log("\n======================================================");
        console.log("🎉 ALL SOCKET.IO INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉");
        console.log("======================================================");
        console.log(`\n📊 Final Test Execution Report:`);
        console.log(`- Connection Client 1:  ✅ Passed`);
        console.log(`- Connection Client 2:  ✅ Passed`);
        console.log(`- Room Join Event:      ✅ Passed`);
        console.log(`- Private Chat (1->2):   ✅ Passed`);
        console.log(`- Private Chat (2->1):   ✅ Passed`);
        console.log(`- WebRTC Offer (1->2):   ✅ Passed`);
        console.log(`- WebRTC Answer (2->1):  ✅ Passed`);
        console.log(`- ICE Candidate (1->2):  ✅ Passed`);
        console.log(`- ICE Candidate (2->1):  ✅ Passed`);
        console.log(`- Room Leave Event:     ✅ Passed`);
        console.log("======================================================\n");
        cleanup(0);
    }
}
