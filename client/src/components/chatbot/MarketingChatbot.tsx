import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { MessagesSquare, Send, X, Zap, Sparkles, Clock, History, SaveAll, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import the Lottie animation
import botAnimation from "./marketing-bot-animation.json";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: Date;
}

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    text: "👋 Hi there! I'm your Marketing Advisor, ready to help optimize your advertising campaigns. What would you like to know about your marketing performance?",
    sender: "bot",
    timestamp: new Date(),
  },
];

const suggestedQuestions = [
  "How can I improve my campaign ROI?",
  "Which ad method is performing best?",
  "What's a good budget for my next campaign?",
  "How do I compare to competitors?",
  "Should I try a different ad method?",
];

export default function MarketingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // We need to make sure businessId is available from user context
      if (!user?.businessId) {
        // If no businessId is available, show an error to the user
        throw new Error("No business associated with your account");
      }
      
      const response = await apiRequest("POST", "/api/marketing-advice", {
        message: inputValue,
        businessId: user.businessId, // Send the business ID with the request
      });
      
      if (!response.ok) {
        throw new Error("Failed to get marketing advice");
      }
      
      const data = await response.json();
      
      // Add bot response to chat
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response || "I'm having trouble thinking of a response right now. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get marketing advice. Please try again.",
        variant: "destructive",
      });
      
      // Add error message from bot
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting to my brain at the moment. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-30 marketing-advisor-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"
                    aria-label="Open Marketing Advisor Chat"
                  >
                    <MessagesSquare className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Marketing Advisor</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-96 sm:max-w-lg"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Card className="border-2 overflow-hidden shadow-xl">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 bg-gradient-to-r from-blue-600 to-blue-400 text-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">Marketing Advisor</CardTitle>
                    <CardDescription className="text-blue-50 opacity-90">
                      Personalized marketing advice
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-blue-700"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>

              <div className="flex flex-row gap-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="w-16 h-16">
                  <Lottie
                    animationData={botAnimation}
                    loop={true}
                    style={{ height: 64, width: 64 }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-800">POWERED BY AI</p>
                  <h3 className="text-sm font-semibold">Ask me anything about your marketing campaigns!</h3>
                </div>
              </div>

              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-4 bg-white">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className={`mb-4 ${
                        message.sender === "user" ? "flex justify-end" : "flex justify-start"
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${
                          message.sender === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        <div
                          className={`text-xs mt-1 ${
                            message.sender === "user" ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggested Questions */}
                {messages.length <= 2 && (
                  <div className="p-3 bg-gray-50 border-t">
                    <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs py-1 h-auto"
                          onClick={() => handleSuggestedQuestion(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-3 border-t">
                <form
                  className="flex w-full items-center space-x-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <Textarea
                    placeholder="Ask a marketing question..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 resize-none"
                    rows={1}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputValue.trim() || isLoading}
                    className={`shrink-0 ${
                      isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}