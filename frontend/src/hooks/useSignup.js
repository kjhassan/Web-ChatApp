import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useSignup = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();

	const signup = async ({ fullname, username, password, confirmPassword, gender,contactno }) => {
		console.log("Signup submit payload", { fullname, username, password, confirmPassword, gender, contactno });
		const success = handleInputErrors({ fullname, username, password, confirmPassword, gender });
		if (!success) return;

		setLoading(true);
		try {
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ fullname, username, password, confirmPassword, gender,contactno }),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}
			localStorage.setItem("chat-user", JSON.stringify(data));
			setAuthUser(data);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { loading, signup };
};
export default useSignup;

function handleInputErrors({ fullname, username, password, confirmPassword, gender,contactno }) {
	console.log("Validating signup input", { fullname, username, password, confirmPassword, gender, contactno });
	if (!fullname || !username || !password || !confirmPassword || !gender|| !contactno) {
		console.warn("Validation failed: missing field", { fullname, username, password, confirmPassword, gender, contactno });
		toast.error("Please fill in all fields");
		return false;
	}

	if (password !== confirmPassword) {
		toast.error("Passwords do not match");
		return false;
	}

	if (password.length < 6) {
		toast.error("Password must be at least 6 characters");
		return false;
	}

	return true;
}
