import { contract, contractWithSigner } from "./electionservice.js";

async function test() {
    console.log("Admin:", await contract.admin());

    console.log("Voting before:", await contract.votingOpen());

    const tx = await contractWithSigner.startElection();

    console.log("Transaction sent:", tx.hash);

    await tx.wait();

    console.log("Voting after:", await contract.votingOpen());
}

test();