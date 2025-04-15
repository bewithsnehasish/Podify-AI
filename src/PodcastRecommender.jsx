import React, { useState, useRef, useEffect } from "react";
import { getSearchTerm } from "./lib/geminiWithoutMemory";
import { chatWithMemory } from "./lib/geminiWithMemory";
import {
  Sparkles,
  Send,
  Moon,
  Sun,
  Headphones,
  MessageCircle,
  ExternalLink,
  PlusCircle,
  Podcast,
  Zap,
  Bookmark,
  Radio,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import ReactMarkdown from "react-markdown";

const API_TOKEN = import.meta.env.VITE_PODCHASER_API_KEY;

const PodcastRecommender = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const controls = useAnimation();

  // Check system preference for dark mode
  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setDarkMode(true);
    }
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Animation for new podcasts
  useEffect(() => {
    if (podcasts.length > 0) {
      controls.start({
        scale: [0.97, 1.03, 1],
        opacity: [0.7, 1],
        transition: { duration: 0.5 },
      });
    }
  }, [podcasts, controls]);

  const searchPodcasts = async (searchTerm) => {
    const query = `
      query {
        podcasts(
          searchTerm: "${searchTerm}", 
          first: 4,
          filters: {rating: {minRating: 4, maxRating: 5}}
        ) {
          paginatorInfo {
            currentPage,
            hasMorePages,
            lastPage,
          },
          data {
            id,
            title,
            description,
            webUrl,
            imageUrl,
          }
        }
      }
    `;
    try {
      const response = await fetch("https://api.podchaser.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ query }),
      });
      const result = await response.json();
      if (result.data?.podcasts?.data) {
        return result.data.podcasts.data;
      }
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "system",
          text: "No podcasts found for this search. Try something else!",
        },
      ]);
      return [];
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "system",
          text: "Failed to fetch podcasts. Please check your connection and try again.",
        },
      ]);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");
    setChatHistory((prev) => [...prev, { sender: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const { searchTerm } = await getSearchTerm(userMessage);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "system",
          text: `🔎 Finding podcasts about "${searchTerm}"...`,
        },
      ]);
      const podcastResults = await searchPodcasts(searchTerm);
      setPodcasts(podcastResults);
      const aiResponse = await chatWithMemory(
        userMessage,
        "default",
        podcastResults,
      );
      setChatHistory((prev) => [
        ...prev,
        { sender: "assistant", text: aiResponse },
      ]);

      if (window.innerWidth < 768 && podcastResults.length > 0) {
        setShowChat(false);
      }
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "system",
          text: "Oops, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const toggleView = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowChat(!showChat);
      setIsTransitioning(false);
    }, 300);
  };

  const handleExampleClick = (text) => {
    setMessage(text);
    inputRef.current?.focus();
  };

  const themeClasses = {
    app: darkMode ? "bg-gray-950 text-white" : "bg-slate-50 text-gray-900",
    header: darkMode
      ? "bg-gray-900/80 border-gray-800 backdrop-blur-md"
      : "bg-white/80 border-gray-100 backdrop-blur-md",
    sidebar: darkMode
      ? "bg-gray-900 border-gray-800"
      : "bg-white border-gray-100",
    card: darkMode
      ? "bg-gray-800/80 border-gray-700 hover:bg-gray-800"
      : "bg-white/80 border-gray-200 hover:bg-white",
    input: darkMode
      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-500",
    messageUser: darkMode
      ? "bg-indigo-600 text-white"
      : "bg-indigo-600 text-white",
    messageAI: darkMode
      ? "bg-gray-800/90 text-white border border-gray-700"
      : "bg-white/90 text-gray-800 border border-gray-200",
    messageSystem: darkMode
      ? "bg-gray-800/50 text-gray-300 border border-gray-700/50"
      : "bg-gray-100/80 text-gray-700 border border-gray-200/50",
    icon: darkMode ? "text-gray-300" : "text-gray-600",
    buttonPrimary: darkMode
      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
      : "bg-indigo-600 hover:bg-indigo-700 text-white",
    buttonSecondary: darkMode
      ? "bg-gray-800 hover:bg-gray-700 text-white"
      : "bg-gray-100 hover:bg-gray-200 text-gray-800",
    welcome: darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800",
    gradient: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
    highlight: darkMode ? "text-purple-400" : "text-indigo-600",
    overlay: darkMode ? "bg-gray-950/20" : "bg-white/20",
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 400, damping: 30 },
    },
  };

  return (
    <div
      className={`flex h-screen ${themeClasses.app} relative overflow-hidden`}
    >
      {/* Background gradient elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 -right-40 w-96 h-96 rounded-full ${themeClasses.gradient} blur-3xl opacity-10 animate-pulse`}
          style={{ animationDuration: "8s" }}
        />
        <div
          className={`absolute top-1/3 -left-40 w-80 h-80 rounded-full ${themeClasses.gradient} blur-3xl opacity-10 animate-pulse`}
          style={{ animationDuration: "12s" }}
        />
        <div
          className={`absolute -bottom-40 left-1/3 w-96 h-96 rounded-full ${themeClasses.gradient} blur-3xl opacity-10 animate-pulse`}
          style={{ animationDuration: "10s" }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header
          className={`${themeClasses.header} border-b shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-30`}
        >
          <div className="flex items-center">
            <motion.div
              className={`rounded-full ${themeClasses.gradient} p-2 mr-3 shadow-lg`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Headphones className="h-5 w-5 text-white" />
            </motion.div>
            <motion.h1
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Podify AI
            </motion.h1>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={toggleView}
              className={`p-2 rounded-full ${themeClasses.buttonSecondary} shadow-md`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={showChat ? "Show podcasts" : "Show chat"}
              disabled={isTransitioning}
            >
              {showChat ? (
                <Headphones className="h-5 w-5" />
              ) : (
                <MessageCircle className="h-5 w-5" />
              )}
            </motion.button>
            <motion.button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${themeClasses.buttonSecondary} shadow-md`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </header>

        {/* Main container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-auto">
          {/* Chat section */}
          <AnimatePresence mode="wait">
            {(showChat || window.innerWidth >= 768) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                className={`flex-1 flex flex-col ${!showChat && window.innerWidth < 768 ? "hidden" : ""}`}
              >
                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <div className="max-w-3xl mx-auto">
                    {chatHistory.length === 0 ? (
                      <motion.div
                        className="flex flex-col items-center justify-center h-full text-center p-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <motion.div
                          variants={itemVariants}
                          className={`w-24 h-24 rounded-full ${themeClasses.gradient} flex items-center justify-center mb-6 shadow-lg`}
                        >
                          <Sparkles className="h-12 w-12 text-white" />
                        </motion.div>
                        <motion.h2
                          variants={itemVariants}
                          className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                        >
                          Welcome to Podify AI
                        </motion.h2>
                        <motion.p
                          variants={itemVariants}
                          className={`mb-8 text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                        >
                          Share your mood, interests, or what's on your mind,
                          and I'll recommend podcasts you might enjoy.
                        </motion.p>
                        <motion.div
                          variants={itemVariants}
                          className={`${themeClasses.welcome} rounded-2xl shadow-xl w-full max-w-md p-6 border ${darkMode ? "border-gray-700" : "border-gray-200"} backdrop-blur-sm bg-opacity-80`}
                        >
                          <p className="font-medium mb-4 text-lg">
                            Try asking:
                          </p>
                          <div className="space-y-4">
                            {[
                              "I am stressed out, suggest a podcast to relax",
                              "I want to learn more about cybersecurity",
                              "Relationship advice? 👀",
                            ].map((example, index) => (
                              <motion.div
                                key={index}
                                className={`p-4 ${darkMode ? "bg-gray-800/70 hover:bg-gray-800" : "bg-gray-50/70 hover:bg-gray-100"} rounded-xl cursor-pointer transition-all shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                                whileHover={{
                                  scale: 1.02,
                                  boxShadow: darkMode
                                    ? "0 8px 16px rgba(0,0,0,0.3)"
                                    : "0 8px 16px rgba(0,0,0,0.1)",
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleExampleClick(example)}
                              >
                                <div className="flex items-center">
                                  <div
                                    className={`w-8 h-8 rounded-full ${themeClasses.gradient} flex items-center justify-center mr-3 shadow-sm`}
                                  >
                                    {index === 0 ? (
                                      <Radio className="h-4 w-4 text-white" />
                                    ) : index === 1 ? (
                                      <Zap className="h-4 w-4 text-white" />
                                    ) : (
                                      <Volume2 className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                  <span>{example}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div className="space-y-5 py-4">
                        {chatHistory.map((msg, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.4,
                              type: "spring",
                              stiffness: 400,
                              damping: 40,
                              delay: Math.min(index * 0.1, 0.5),
                            }}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] p-4 rounded-2xl shadow-md ${
                                msg.sender === "user"
                                  ? `${themeClasses.messageUser} rounded-br-none`
                                  : msg.sender === "system"
                                    ? `${themeClasses.messageSystem}`
                                    : `${themeClasses.messageAI} rounded-bl-none backdrop-blur-sm`
                              }`}
                            >
                              {msg.sender === "assistant" && (
                                <div className="flex items-center mb-2">
                                  <div
                                    className={`w-6 h-6 rounded-full ${themeClasses.gradient} flex items-center justify-center mr-2`}
                                  >
                                    <Podcast className="h-3 w-3 text-white" />
                                  </div>
                                  <span
                                    className={`${themeClasses.highlight} text-sm font-medium`}
                                  >
                                    Podify AI
                                  </span>
                                </div>
                              )}
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {isLoading && (
                          <motion.div
                            className="flex justify-start"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div
                              className={`${themeClasses.messageAI} p-4 rounded-2xl shadow-md rounded-bl-none backdrop-blur-sm max-w-[80%]`}
                            >
                              <div className="flex items-center mb-2">
                                <div
                                  className={`w-6 h-6 rounded-full ${themeClasses.gradient} flex items-center justify-center mr-2`}
                                >
                                  <Podcast className="h-3 w-3 text-white" />
                                </div>
                                <span
                                  className={`${themeClasses.highlight} text-sm font-medium`}
                                >
                                  Podify AI
                                </span>
                              </div>
                              <LoadingSpinner />
                            </div>
                          </motion.div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Message input */}
                <div
                  className={`${themeClasses.header} sticky bottom-0 border-t p-4 z-20`}
                >
                  <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="relative">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Share your mood or interests..."
                        ref={inputRef}
                        className={`w-full px-5 py-4 pr-14 rounded-full border shadow-md ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                        disabled={isLoading}
                      />
                      <motion.button
                        type="submit"
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${isLoading ? "bg-gray-400" : themeClasses.gradient} rounded-full p-3 text-white shadow-md`}
                        disabled={isLoading}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        aria-label="Send message"
                      >
                        <Send className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Podcast recommendations */}
          <AnimatePresence mode="wait">
            {(!showChat || window.innerWidth >= 768) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                className={`md:w-1/2 lg:w-2/5 ${themeClasses.sidebar} border-l overflow-y-auto ${showChat && window.innerWidth < 768 ? "hidden" : ""} relative z-10`}
              >
                <div className="p-6">
                  <motion.h2
                    className="text-xl font-bold mb-6 flex items-center"
                    animate={controls}
                  >
                    <div
                      className={`p-2 rounded-full ${themeClasses.gradient} mr-3 shadow-md`}
                    >
                      <Headphones className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                      Recommended Podcasts
                    </span>
                  </motion.h2>
                  {podcasts.length > 0 ? (
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {podcasts.map((podcast, index) => (
                        <PodcastCard
                          key={podcast.id}
                          podcast={podcast}
                          darkMode={darkMode}
                          themeClasses={themeClasses}
                          index={index}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <EmptyPodcastState
                      darkMode={darkMode}
                      themeClasses={themeClasses}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const PodcastCard = ({ podcast, darkMode, themeClasses, index }) => {
  const cardControls = useAnimation();

  useEffect(() => {
    cardControls.start({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    });
  }, [cardControls, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={cardControls}
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 400 } }}
      className={`${themeClasses.card} rounded-2xl shadow-xl overflow-hidden border transition-all duration-300 group backdrop-blur-sm`}
    >
      <div className="relative">
        {podcast.imageUrl ? (
          <motion.div
            className="relative h-48 overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={podcast.imageUrl}
              alt={podcast.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) =>
                (e.target.src =
                  "https://via.placeholder.com/400x200?text=Podcast")
              }
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </motion.div>
        ) : (
          <div
            className={`w-full h-48 ${themeClasses.gradient} flex items-center justify-center`}
          >
            <motion.div
              animate={{
                rotate: 360,
                transition: { duration: 20, repeat: Infinity, ease: "linear" },
              }}
            >
              <Headphones className="w-16 h-16 text-white/80" />
            </motion.div>
          </div>
        )}
        <motion.div
          className="absolute top-3 right-3"
          whileHover={{ scale: 1.2, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
        >
          <button
            className={`w-8 h-8 rounded-full ${themeClasses.gradient} flex items-center justify-center shadow-lg`}
            aria-label="Bookmark podcast"
          >
            <Bookmark className="w-4 h-4 text-white" />
          </button>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-lg leading-snug line-clamp-2 drop-shadow-md">
            {podcast.title}
          </h3>
        </div>
      </div>
      <div className="p-5">
        <p
          className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} line-clamp-3 mb-4 min-h-[3rem]`}
        >
          {podcast.description || "No description available."}
        </p>
        <div className="flex justify-between items-center">
          <motion.span
            whileHover={{ scale: 1.1 }}
            className={`text-xs px-3 py-1 rounded-full ${themeClasses.gradient} text-white shadow-sm`}
          >
            ID: {podcast.id}
          </motion.span>
          {podcast.webUrl && (
            <motion.a
              href={podcast.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center text-sm font-medium ${themeClasses.highlight} hover:underline px-3 py-1 rounded-full ${darkMode ? "bg-gray-700/50" : "bg-gray-100/70"}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Listen to ${podcast.title}`}
            >
              Listen <ExternalLink className="w-3 h-3 ml-1" />
            </motion.a>
          )}
        </div>
      </div>
      <WaveAnimation className={`w-full h-2 ${themeClasses.gradient} mt-2`} />
    </motion.div>
  );
};

const LoadingSpinner = () => {
  return (
    <motion.div
      className="relative w-12 h-12"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border-t-4 border-indigo-500"
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{
          rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border-t-4 border-purple-500"
        animate={{ rotate: -360, scale: [1, 0.9, 1] }}
        transition={{
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          },
        }}
      />
    </motion.div>
  );
};

const EmptyPodcastState = ({ darkMode, themeClasses }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full text-center p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        className={`w-32 h-32 ${themeClasses.gradient} rounded-full flex items-center justify-center mb-8 relative`}
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(129, 140, 248, 0.5)",
            "0 0 0 20px rgba(129, 140, 248, 0)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Headphones className="w-16 h-16 text-white" />
      </motion.div>
      <motion.h3
        className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Discover Your Next Favorite Podcast
      </motion.h3>
      <motion.p
        className={`text-lg mb-8 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Ask me anything about your interests, mood, or what you're looking for!
      </motion.p>
      <motion.div
        className={`${themeClasses.gradient} text-white p-4 rounded-2xl shadow-lg inline-block`}
        whileHover={{ scale: 1.05 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="font-medium">⚡Made By Snehasish Mandal (12314032)⚡</p>
      </motion.div>
    </motion.div>
  );
};

const WaveAnimation = ({ className }) => {
  return (
    <div className={`flex h-6 items-end overflow-hidden ${className}`}>
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 mx-px rounded-t-sm"
          animate={{
            height: [
              `${20 + Math.random() * 80}%`,
              `${20 + Math.random() * 80}%`,
              `${20 + Math.random() * 80}%`,
            ],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default PodcastRecommender;
