import { useContext,useState,createContext } from "react";
import { AuthContext } from "./AuthContext";
import { useEffect } from "react";
import toast from "react-hot-toast";


export const ChatContext = createContext();

export const ChatProvider = ({children})=>{
    const [messages,setMessages] = useState([]);
    const [users,setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
const [unSeenMessages, setUnSeenMessages] = useState({});
    const {socket,axios} = useContext(AuthContext);

    //function to get all users
    const getUsers = async()=>{
        try {
            const { data } = await axios.get('/message/users');
            if (data.success) {
                setUsers(data.users);
                // server returns unSeenMessages key
                setUnSeenMessages(data.unSeenMessages || {});
            }

        } catch (error) {
            toast.error(error.message);
        }
    }
    //function to get message for selected user
    const getMessage = async (userId)=>{
        try {
            const {data} = await axios.get(`/message/${userId}`);
            if(data.success){
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    //finction to send mesage to selected user
        const sendMessage = async (messagesData) => {
        if (!selectedUser) {
            toast.error("No user selected");
            return;
        }
        try {
                const { data } = await axios.post(`/message/send/${selectedUser._id}`, messagesData);
                if (data.success) {
                    // server returns the created message under data
                    setMessages((prevMessages) => [...prevMessages, data.data]);
            } else {
                toast.error("Failed to send message");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };


    //Function to Subscriber to message for selected user

    const subscribeToMessage = () => {
    if (!socket) return;

    // server emits 'new-message' — listen for it
    socket.on("new-message", (newMessage) => {
        // normalize sender id
        const senderId = newMessage?.sender || newMessage?.senderId || newMessage?.data?.sender;
        const messageObj = newMessage?.data || newMessage;
        if (selectedUser && String(senderId) === String(selectedUser._id)) {
            messageObj.seen = true;
            setMessages((prevMessages) => [...prevMessages, messageObj]);
            axios.put(`/message/seen/${messageObj._id}`);
        } else {
            setUnSeenMessages((prevUnseen) => ({
                ...prevUnseen,
                [senderId]: prevUnseen[senderId] ? prevUnseen[senderId] + 1 : 1,
            }));
        }
    });
    };
    //unsubscriber the messages
    const unsubscribeToMessage = ()=>{
        if(socket) socket.off("new-message");

    }
    useEffect(() => {
    unsubscribeToMessage(); // prevent duplicate listeners
    subscribeToMessage();
    return () => unsubscribeToMessage();
    }, [socket, selectedUser]);

    const value= {
        messages,
        users,
        selectedUser,
        getUsers,
        setMessages,
        sendMessage,
        setSelectedUser,
        unSeenMessages,
        setUnSeenMessages,
        getMessage,

    };
    return(
        <ChatContext.Provider value={value}>
            {children }
        </ChatContext.Provider>
    )
};