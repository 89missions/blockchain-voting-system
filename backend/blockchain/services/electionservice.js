import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const provider = new ethers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL
);

const wallet = new ethers.Wallet(
    process.env.BLOCKCHAIN_PRIVATE_KEY,
    provider
);

const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/Election.sol/Election.json"
);

const artifact = JSON.parse(
    fs.readFileSync(artifactPath, "utf8")
);

const getElectionContract = (contractAddress) => {

    if (!contractAddress) {
        throw new Error(
            "Election contract address is required"
        );
    }

    return new ethers.Contract(
        contractAddress,
        artifact.abi,
        provider
    );
};

const getElectionContractWithSigner = (contractAddress) => {

    if (!contractAddress) {
        throw new Error(
            "Election contract address is required"
        );
    }

    const contract = new ethers.Contract(
        contractAddress,
        artifact.abi,
        provider
    );

    return contract.connect(wallet);
};


export {
    provider,
    wallet,
    getElectionContract,
    getElectionContractWithSigner
};