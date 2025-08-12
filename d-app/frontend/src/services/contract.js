import { ethers } from "ethers";
import abi from "./contractABI.json";
import { CONTRACT_ADDRESS } from "../config.js";

let contract;

export const connectContract = async () => {
  if (!window.ethereum) throw new Error("MetaMask not installed");

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer);
  return contract;
};

export const getSignedMessage = async (message) => {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  const signature = await signer.signMessage(message);

  return { signature, address };
};

export const createVotingTopic = async (votingTopicId, votingTopicName) => {
  const contract = await connectContract();
  const tx = await contract.createVotingTopic(votingTopicId, votingTopicName);
  await tx.wait();
};

export const registerVoter = async (votingTopicId) => {
  const contract = await connectContract();
  const tx = await contract.registerVoter(votingTopicId);
  await tx.wait();
};

export const verifyVoter = async (votingTopicId, walletAddress) => {
  const contract = await connectContract();
  const tx = await contract.verifyVoter(votingTopicId, walletAddress);
  await tx.wait();
};

export const addCandidate = async (
  votingTopicId,
  candidateId,
  candidateName
) => {
  const contract = await connectContract();
  const tx = await contract.addCandidate(
    votingTopicId,
    candidateId,
    candidateName
  );
  await tx.wait();
};

export const castVote = async (votingTopicId, candidateId) => {
  const contract = await connectContract();
  const tx = await contract.vote(votingTopicId, candidateId);
  await tx.wait();
};

export const publishResult = async (votingTopicId) => {
  const contract = await connectContract();
  const tx = await contract.publishResult(votingTopicId);
  await tx.wait();
};
