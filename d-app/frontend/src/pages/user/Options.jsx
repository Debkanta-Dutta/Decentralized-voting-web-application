import { useNavigate } from "react-router-dom";
import {
  FaUserPlus,
  FaUsers,
  FaList,
  FaVoteYea,
  FaHistory,
  FaUserEdit,
  FaChartBar,
  FaCheckCircle,
  FaClipboardCheck,
  FaUserShield,
  FaBullhorn,
} from "react-icons/fa";

const Options = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Candidate",
      options: [
        {
          label: "Apply as Candidate",
          icon: <FaUserPlus />,
          path: "/apply-candidate",
        },
      ],
    },
    {
      title: "Voter",
      options: [
        { label: "Voter List", icon: <FaUsers />, path: "/voter-list" },
        { label: "Candidate List", icon: <FaList />, path: "/candidate-list" },
        { label: "Voting", icon: <FaVoteYea />, path: "/voting" },
        {
          label: "Voting History",
          icon: <FaHistory />,
          path: "/history",
        },
        {
          label: "Update Voter Profile",
          icon: <FaUserEdit />,
          path: "/update-profile",
        },
        {
          label: "Voting Result",
          icon: <FaChartBar />,
          path: "/voting/result",
        },
      ],
    },
    {
      title: "Topic Owner",
      options: [
        {
          label: "Enable Voting",
          icon: <FaCheckCircle />,
          path: "/enable-voting",
        },
        {
          label: "Approve Candidates",
          icon: <FaClipboardCheck />,
          path: "/approve-candidates",
        },
        {
          label: "Verify Voters",
          icon: <FaUserShield />,
          path: "/verify-voters",
        },
        {
          label: "Publish Result",
          icon: <FaBullhorn />,
          path: "/admin/result",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Options Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-8">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition"
          >
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              {section.title}
            </h2>
            <div className="flex flex-col gap-3">
              {section.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => navigate(opt.path)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 hover:bg-blue-100 transition"
                >
                  <span className="text-lg text-blue-600">{opt.icon}</span>
                  <span className="text-gray-800 font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Options;
