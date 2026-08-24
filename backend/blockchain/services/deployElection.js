import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to Hardhat blockchain
const provider = new ethers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL
);

// Admin wallet that deploys the contract
const wallet = new ethers.Wallet(
    process.env.BLOCKCHAIN_PRIVATE_KEY,
    provider
);

// Load compiled contract
const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/Election.sol/Election.json"
);

const artifact = JSON.parse(
    fs.readFileSync(artifactPath, "utf8")
);


// Deploy a new Election contract
const deployElectionContract = async (startTime, endTime) => {

    const factory = new ethers.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        wallet
    );

    // Deploy contract with election start and end timestamps
    const contract = await factory.deploy(
        startTime,
        endTime
    );

    // Wait until deployment is confirmed
    await contract.waitForDeployment();

    // Get deployed contract address
    const contractAddress = await contract.getAddress();

    console.log("Election contract deployed:", contractAddress);
    console.log("Start time:", startTime);
    console.log("End time:", endTime);

    return contractAddress;
};

export default deployElectionContract;