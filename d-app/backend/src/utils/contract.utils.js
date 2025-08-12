import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

import { contractJSON } from "../abi/VotingSystem.js";

const contractABI = contractJSON.abi;
const contractAddress = process.env.CONTRACT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
const contract = new ethers.Contract(contractAddress, contractABI, provider);

export default contract;
