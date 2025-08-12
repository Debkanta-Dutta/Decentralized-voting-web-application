const Button = ({ text, onClick, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
  >
    {text}
  </button>
);

export default Button;
