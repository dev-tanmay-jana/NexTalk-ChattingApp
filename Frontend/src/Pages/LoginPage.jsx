import React, { useState } from 'react';
import assets from '../assets/assets';
import { useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [currentState, setCurrentState] = useState("SignUp"); // "Login" or "SignUp"
    const {loginUser, authUser}  = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        bio: "",
    });

    // Generic handler for input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
        ...prev,
        [name]: value,
        }));
    };


    const [isDataSubmitted, setIsDataSubmitted] = useState(false);

    //loginfinction 
    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (currentState === "SignUp" && !isDataSubmitted) {
            // Validate that fullName/email/password are provided for signup first step
            if (!formData.fullName || !formData.email || !formData.password) {
                alert("Please fill in name, email and password to continue");
                return;
            }
            setIsDataSubmitted(true);
            return;
        }

        // If final signup step, ensure bio is present
        if (currentState === "SignUp" && isDataSubmitted) {
            if (!formData.bio) {
                alert("Please enter a short bio to create your account");
                return;
            }
        }

        // Call loginUser (handles both signup and login) and wait for result
        const success = await loginUser(currentState === 'SignUp' ? 'signup' : 'login', formData);
        if (success) {
            setFormData({
                fullName: "",
                email: "",
                password: "",
                bio: "",
            });
        }
    };

    // Redirect to home if user is authenticated
    if(authUser) {
        navigate('/');
    }

  return (
    <div className="min-h-screen p-6 bg-cover bg-center flex items-center justify-center gap-10 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl">
      {/* Left Section - hidden below 950px */}
      <img
        src={assets.logo_big}
        alt="logo"
        className="w-[min(30vw,250px)] hidden [@media(max-width:950px)]:hidden md:block"
      />

      {/* Right Section */}
      <form onSubmit={onSubmitHandler} className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg w-[min(80vw,300px)]">
        <h2 className="text-2xl font-semibold text-center  flex justify-between items-center">
          {currentState}
          {isDataSubmitted && currentState === "SignUp" && <img onClick={()=>setIsDataSubmitted(false)} src={assets.arrow_icon} alt="arrow" className="w-5 cursor-pointer" />
            }

        </h2>
        {currentState === "SignUp" && !isDataSubmitted && 
         (<input 
            onChange={handleChange} value={formData.fullName} 
            type="text" name="fullName" placeholder="Full Name" 
            className="p-2 rounded-md bg-white/20 border border-gray-400 text-white focus:outline-none" required />
        )}
        {currentState === "Login" || !isDataSubmitted ? (
            <>
            <input 
            onChange={handleChange} value={formData.email}
            type="email" name="email" placeholder="Email" 
            className="p-2 rounded-md bg-white/20 border border-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            <input 
            onChange={handleChange} value={formData.password} 
            type="password" name="password" placeholder="Password" 
            className="p-2 rounded-md bg-white/20 border border-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </>
        ) : null}
        {currentState === "SignUp" && isDataSubmitted && (
            <textarea rows={4}
            onChange={handleChange} value={formData.bio}
            name="bio" placeholder="Short Bio" 
            className="p-2 rounded-md bg-white/20 border border-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
        )}
        
        <button type='submit'
        className='py-3 bg-gradient-to-r from-purple-400 to-indigo-600 text-white rounded-md cursor-pointer'
        >
            {currentState === "SignUp" ? (isDataSubmitted ? "Create Account" : "Next") : "Login"}
        </button>
        <div className=' flex flex-col  gap-2 text-sm text-gray-300'>
            {currentState === "SignUp" ? (
                <p className='flex gap-2'>
                    Already have an account?
                    <span onClick={() => { setCurrentState("Login"); setIsDataSubmitted(false); setFormData({fullName: "", email: "", password: "", bio: ""}) }}
                     className="text-indigo-500 cursor-pointer">Login here</span>
                </p>
            ) : (
                <p className='flex gap-2'>
                    Create a new account?
                    <span onClick={() => { setCurrentState("SignUp"); setIsDataSubmitted(false); setFormData({fullName: "", email: "", password: "", bio: ""}) }}
                     className="text-indigo-500 cursor-pointer">Sign Up here</span>
                </p>
             )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;