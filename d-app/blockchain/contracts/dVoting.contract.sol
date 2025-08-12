// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingSystem {
    struct Voter {
        bool isRegistered;
        bool isVerified;
        bool hasVoted;
        uint votedTo;
    }

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct VotingTopic {
        string topicName;
        mapping(address => Voter) voters;
        Candidate[] candidates;
        mapping(uint => bool) isCandidate;
        bool resultPublished;
        uint winningCandidateId;
        uint[] candidateIds;
        address[] voterAddresses;
    }

    mapping(string => VotingTopic) public votingTopics;
    mapping(string => address) public votingTopicOwners;

    event VotingTopicCreated(string votingId, string topicName);
    event VoterRegistered(string votingId, address voter);
    event VoterVerified(string votingId, address voter);
    event CandidateAdded(string votingId, uint id, string name);
    event VoteCast(string votingId, address voter, uint candidateId);
    event ResultPublished(string votingId);

    modifier onlyTopicOwner(string memory votingId) {
        require(
            msg.sender == votingTopicOwners[votingId],
            "Not the topic owner"
        );
        _;
    }

    modifier onlyVerifiedVoter(string memory votingId) {
        require(
            votingTopics[votingId].voters[msg.sender].isRegistered,
            "You are not registered"
        );
        require(
            votingTopics[votingId].voters[msg.sender].isVerified,
            "You are not verified"
        );
        _;
    }

    function createVotingTopic(
        string memory votingId,
        string memory topicName
    ) external {
        require(
            bytes(votingTopics[votingId].topicName).length == 0,
            "Voting topic already exists"
        );
        votingTopics[votingId].topicName = topicName;
        votingTopicOwners[votingId] = msg.sender;
        emit VotingTopicCreated(votingId, topicName);
    }

    function addCandidate(
        string memory votingId,
        uint id,
        string memory name
    ) external onlyTopicOwner(votingId) {
        require(
            !votingTopics[votingId].isCandidate[id],
            "Candidate ID already used"
        );
        votingTopics[votingId].candidates.push(Candidate(id, name, 0));
        votingTopics[votingId].isCandidate[id] = true;
        votingTopics[votingId].candidateIds.push(id);
        emit CandidateAdded(votingId, id, name);
    }

    function registerVoter(string memory votingId) external {
        require(
            !votingTopics[votingId].voters[msg.sender].isRegistered,
            "Already registered"
        );
        votingTopics[votingId].voters[msg.sender] = Voter(
            true,
            false,
            false,
            0
        );
        votingTopics[votingId].voterAddresses.push(msg.sender);
        emit VoterRegistered(votingId, msg.sender);
    }

    function verifyVoter(
        string memory votingId,
        address voter
    ) external onlyTopicOwner(votingId) {
        require(
            votingTopics[votingId].voters[voter].isRegistered,
            "Voter not registered"
        );
        votingTopics[votingId].voters[voter].isVerified = true;
        emit VoterVerified(votingId, voter);
    }

    function vote(
        string memory votingId,
        uint candidateId
    ) external onlyVerifiedVoter(votingId) {
        require(
            !votingTopics[votingId].voters[msg.sender].hasVoted,
            "Already voted"
        );
        require(
            votingTopics[votingId].isCandidate[candidateId],
            "Invalid candidate"
        );

        votingTopics[votingId].voters[msg.sender].hasVoted = true;
        votingTopics[votingId].voters[msg.sender].votedTo = candidateId;
        votingTopics[votingId]
            .candidates[getCandidateIndex(votingId, candidateId)]
            .voteCount++;

        emit VoteCast(votingId, msg.sender, candidateId);
    }

    function publishResult(
        string memory votingId
    ) external onlyTopicOwner(votingId) {
        require(
            !votingTopics[votingId].resultPublished,
            "Result already published"
        );

        uint maxVotes = 0;
        uint winnerId = 0;

        for (uint i = 0; i < votingTopics[votingId].candidateIds.length; i++) {
            uint id = votingTopics[votingId].candidateIds[i];
            uint votes = votingTopics[votingId]
                .candidates[getCandidateIndex(votingId, id)]
                .voteCount;
            if (votes > maxVotes) {
                maxVotes = votes;
                winnerId = id;
            }
        }

        votingTopics[votingId].winningCandidateId = winnerId;
        votingTopics[votingId].resultPublished = true;

        emit ResultPublished(votingId);
    }

    function getCandidateIndex(
        string memory votingId,
        uint id
    ) internal view returns (uint) {
        for (uint i = 0; i < votingTopics[votingId].candidates.length; i++) {
            if (votingTopics[votingId].candidates[i].id == id) {
                return i;
            }
        }
        revert("Candidate not found");
    }

    function getAllCandidates(
        string memory votingId
    ) external view returns (Candidate[] memory) {
        return votingTopics[votingId].candidates;
    }

    function getVoterInfo(
        string memory votingId,
        address voter
    ) external view returns (Voter memory) {
        return votingTopics[votingId].voters[voter];
    }

    function getWinner(
        string memory votingId
    ) external view returns (Candidate memory) {
        require(
            votingTopics[votingId].resultPublished,
            "Result not yet published"
        );
        uint winnerId = votingTopics[votingId].winningCandidateId;
        return
            votingTopics[votingId].candidates[
                getCandidateIndex(votingId, winnerId)
            ];
    }

    function getTotalVoters(
        string memory votingId
    ) external view returns (uint) {
        return votingTopics[votingId].voterAddresses.length;
    }
}
