import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-indigo-700 mb-10">
        Decentralized Voting System
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        <Link
          to="/set-voting"
          className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition"
        >
          Create New Voting Topic
        </Link>

        <Link
          to="/update-profile"
          className="bg-gray-800 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-900 transition"
        >
          Set Existing Voting Topic
        </Link>
      </div>
    </div>
  );
}

export default Home;
