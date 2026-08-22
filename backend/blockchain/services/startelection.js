import { contractWithSigner } from "./electionservice.js";

const start = async () => {
    try {
        const tx = await contractWithSigner.startElection();

        console.log("Transaction sent:", tx.hash);

        await tx.wait();

        console.log("Election started successfully!");

        const status = await contractWithSigner.votingOpen();

        console.log("Voting open:", status);
    } catch (error) {
        console.error("Error starting election:", error);
    }
};

start();