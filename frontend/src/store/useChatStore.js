import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore"; 
import { useStreamStore } from "./useStreamStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedUser: null,
  selectedUserSocketId: null,
  selectedGroup: null,
  isUsersLoading: true, 
  isMessagesLoading: false,
  sidebarRefresh: true,
  isUserMessageLoading: false, 
newMessageFromUser: false,

 
setNewMsg: (boolval)=> set({newMessageFromUser: boolval}),
  setVideoCall: (boolval)=> set({videoCall: boolval}),
  
  getNotifications: async () => {
    const socket = useAuthStore.getState().socket;

    socket.on("notification", () => {
      set({ sidebarRefresh: true })

    }
    )
  }, 
 
  getUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: [...res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  addFriend: async (friendId) => {
    try {
      const res = await axiosInstance.patch(`/messages/add-friend/${friendId}`);
      set({ users: res.data.updatedFriends });
      toast.success("Friend added successfully");
      set({ sidebarRefresh: true })
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  removeFriend: async (friendId) => {
    try {
      const res = await axiosInstance.patch(`/messages/add-friend/${friendId}`);
      set({ users: res.data.updatedFriends });
      toast.success("Friend removed successfully");
      set({ sidebarRefresh: true })
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },


  createGroup: async (groupData) => {
    try {
      const { groups } = get();
      const res = await axiosInstance.post("/groups/create-group", groupData);
      set({ groups: res.data.updatedGroups });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.data.message);
    }
  },

  getMessages: async (user, page) => {
    if (page == 1) set({ isMessagesLoading: true });
    try { 
      let res
      if (user.fullName === undefined) res = await axiosInstance.get(`/groups/get-group-messages/${user._id}`);
      else res = await axiosInstance.get(`/messages/${user._id}/${page}`);

      // const stream = await axiosInstance.get(`/auth/get-stream/${user._id}`);
      // console.log("stream",stream)

      const socket = useAuthStore.getState().socket; 

      socket.emit("getSocketId", user._id, socket.id);
      console.log("dedo bro", user._id)

      if (res.data != null)
        set({ messages: res.data });
       const x = get().newMessageFromUser
      set({
        newMessageFromUser: true
      }) 
      //   set({ streamData: stream.data });
      // }
    } catch (error) {
      console.log(error.response?.message || "An error occurred while fetching messages.");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getAiMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      let res = {};
      if (selectedUser.fullName !== undefined)
        res = await axiosInstance.post(`/messages/ai-chat`, { ...messageData, receiverId: selectedUser._id, groupId: null });
      else
        res = await axiosInstance.post(`/messages/ai-chat`, { ...messageData, receiverId: null, groupId: selectedUser._id });
      const newMes = { ...res.data, _id: "1", senderId: "67af8f1706ba3b36e9679f9d", senderInfo: { fullName: "Rapid AI", profilePic: "https://imgcdn.stablediffusionweb.com/2024/10/20/a11e6805-65f5-4402-bef9-891ab7347104.jpg" } };

      set({ messages: [...messages, newMes] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  getStreamAiMessage: async (messageData) => {
       const { selectedUser, messages } = get();
      console.log("mes", messageData)

    try {
      let res = {};
      if (selectedUser.fullName !== undefined) {

        const  streamData = useStreamStore.getState().streamData
        console.log("streamData", streamData.streamInfo?.data)
        res = await axiosInstance.post(`/stream/stream-ai`, { ...messageData, data: streamData?.streamInfo?.data?.slice(0, 5800), receiverId: selectedUser._id, groupId: null });
      }
      else
        res = await axiosInstance.post(`/stream/stream-ai`, { ...messageData, receiverId: null, groupId: selectedUser._id });
 
      const newMes = { ...res.data, _id: "1", senderId: "67af8f1706ba3b36e9679f9d", senderInfo: { fullName: "Rapid AI", profilePic: "https://imgcdn.stablediffusionweb.com/2024/10/20/a11e6805-65f5-4402-bef9-891ab7347104.jpg" } };
        set({ messages: [...messages, newMes] });

    } catch (error) {
      console.log(error)
      toast.error("error in getting stream ai message" + error);
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      let res;
      if (selectedUser.name !== undefined)
        res = await axiosInstance.post(`/groups/send-group-message`, { ...messageData, groupId: selectedUser._id });
      else res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      
      set({ messages: [...messages, res.data] });
      // set({ isUserMessageLoading: true });
      set({ sidebarRefresh: true })

    } catch (error) {
      toast.error(error.response.data.message);
    }
    finally {
      // set({ isUserMessageLoading: false });
    }
  },

  sendImage: async (messageData) => {
    const { selectedUser, messages } = get();

    try {
      const res = await axiosInstance.post(`/messages/send-image/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
      set({ sidebarRefresh: true })

    } catch (error) {
      toast.error(error.response.data.message);
    }
  }, 

  endStream: async () => {
    try {
      const { selectedUser } = get();
      const res = await axiosInstance.get(`/auth/user/end-stream/${selectedUser._id}`)
      console.log("here ", res.data)
      toast.success("Stream ended successfully");
    } catch (error) {
      toast.error("Couldn't end the stream");

    }
  },
 

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;


    socket.on('takeSocketId', data=>{
      set({selectedUserSocketId: data})
      console.log("lelo bro" , data)
    })

    socket.on("newMessage", (newMessage) => {
      set({ sidebarRefresh: true })

      const isMessageSentFromSelectedUser = (newMessage.senderId === selectedUser._id);
      if (!isMessageSentFromSelectedUser) {
        return;
      }
     
      set({
        messages: [...get().messages, newMessage],
      });

    });
  },
subscribeToGroup: () => { 
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    socket.emit("joinGroup", { groupId: selectedUser._id, userId: authUser._id });

    

    socket.on("receiveGroupMessage", (newMessage) => {
      set({ sidebarRefresh: true })
      const isMessageSentFromSelectedUser = (newMessage.groupId === selectedUser._id);
      if (!isMessageSentFromSelectedUser) {
        return;
      }
      set({
        messages: [...get().messages, newMessage],
      });
    })
 
    socket.on("recieveGroupVideoCall", (newMessage) => {
      set({ sidebarRefresh: true })
      const isMessageSentFromSelectedUser = (newMessage.groupId === selectedUser._id);
      if (!isMessageSentFromSelectedUser) {
        return;
      }
      set({
        messages: [...get().messages, newMessage],
      });
    })
  }, 
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();

    if (selectedUser?.fullName) socket.off("newMessage");
    else socket.off("receiveGroupMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setSidebarRefresh: (booleanVal) => set({ sidebarRefresh: booleanVal }), 
}));