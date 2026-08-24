import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {

    // =========================
    // ENVIRONMENT VARIABLES
    // =========================

    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

    if (!rpcUrl) {
        throw new Error(
            "BLOCKCHAIN_RPC_URL is not defined in .env"
        );
    }

    if (!privateKey) {
        throw new Error(
            "BLOCKCHAIN_PRIVATE_KEY is not defined in .env"
        );
    }


    // =========================
    // GET ELECTION TIMES
    // =========================

    const startTime = process.argv[2];
    const endTime = process.argv[3];

    if (!startTime || !endTime) {
        throw new Error(
            "Usage: npx tsx scripts/deploy.ts <startTime> <endTime>"
        );
    }


    // =========================
    // CONNECT TO BLOCKCHAIN
    // =========================

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const wallet = new ethers.Wallet(
        privateKey,
        provider
    );

    console.log("Deploying from:", wallet.address);


    // =========================
    // LOAD CONTRACT
    // =========================

    const artifactPath = path.join(
        process.cwd(),
        "artifacts/contracts/Election.sol/Election.json"
    );

    if (!fs.existsSync(artifactPath)) {
        throw new Error(
            "Election contract artifact not found. Run `npx hardhat compile` first."
        );
    }

    const artifact = JSON.parse(
        fs.readFileSync(artifactPath, "utf8")
    );


    // =========================
    // DEPLOY CONTRACT
    // =========================

    const factory = new ethers.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        wallet
    );

    console.log("Deploying Election contract...");
    console.log("Start time:", startTime);
    console.log("End time:", endTime);

    const contract = await factory.deploy(
        BigInt(startTime),
        BigInt(endTime)
    );

    await contract.waitForDeployment();

    const contractAddress =
        await contract.getAddress();


    // =========================
    // RESULT
    // =========================

    console.log("");
    console.log("================================");
    console.log("Election contract deployed!");
    console.log("================================");
    console.log("Contract address:", contractAddress);
    console.log("Start time:", startTime);
    console.log("End time:", endTime);
    console.log("Deployer:", wallet.address);
    console.log("");
}

main().catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exit(1);
});