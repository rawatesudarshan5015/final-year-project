'use client';
import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/db';
import { UserAvatar } from './UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { CheckIcon } from '@heroicons/react/24/outline';

interface Props {
  recipientId: number;
  recipientName: string;
  recipientImageUrl?: string;
}

export function MessagePanel({ recipientId, recipientName, recipientImageUrl }: Props) {
  // Debug recipient info
  console.log('[MessagePanel] Recipient info:', {
    id: recipientId,
    name: recipientName,
    has_image: !!recipientImageUrl,
    image_url: recipientImageUrl,
    image_url_type: typeof recipientImageUrl
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserImage, setCurrentUserImage] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastPolledAt = useRef<number>(Date.now());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user info from localStorage
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.id);
    }
    
    if (userInfo) {
      try {
        const parsedInfo = JSON.parse(userInfo);
        setCurrentUserName(parsedInfo.name || 'You');
        setCurrentUserImage(parsedInfo.profile_pic_url || null);
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      const container = messageContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  // Check if user is trying to message themselves
  const isSelfMessaging = currentUserId === recipientId;

  const fetchMessages = async (isInitialFetch = false) => {
    if (isSelfMessaging) {
      setIsInitialLoading(false);
      return;
    }

    if (isInitialFetch) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages?with=${recipientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // Only update if there are new messages or this is the initial fetch
        if (isInitialFetch || data.messages.length !== messages.length) {
          setMessages(data.messages);
          if (isInitialFetch || data.messages.length > messages.length) {
            // Only scroll on initial load or when new messages arrive
            scrollToBottom();
          }
        }
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch messages');
      }
      lastPolledAt.current = Date.now();
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to connect to the server');
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Clear previous interval when recipient changes
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Initial fetch
    fetchMessages(true);
    
    // Set up polling
    pollingIntervalRef.current = setInterval(() => {
      // Only poll if the user hasn't interacted with the chat in the last 5 seconds
      const timeSinceLastPoll = Date.now() - lastPolledAt.current;
      if (timeSinceLastPoll > 5000) {
        fetchMessages(false);
      }
    }, 5000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [recipientId, isSelfMessaging]);

  // Reset polling timer when user interacts with the chat
  const resetPollingTimer = () => {
    lastPolledAt.current = Date.now();
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId || isSelfMessaging || isSending) return;
    
    resetPollingTimer();
    setIsSending(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: recipientId,
          content: newMessage.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        // Add the new message locally first
        const newMessageObj: Message = {
          id: data.message._id,
          _id: data.message._id,
          conversation_id: data.conversationId,
          sender_id: currentUserId,
          content: newMessage.trim(),
          created_at: new Date(),
        };
        
        setMessages(prev => [...prev, newMessageObj]);
        setNewMessage('');
        scrollToBottom();
        
        // Focus back on input after sending
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to connect to the server');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateString: string | Date) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    return messageDate.toLocaleDateString([], { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: {date: string, messages: Message[]}[], message) => {
    const messageDate = new Date(message.created_at);
    const dateKey = messageDate.toDateString();
    
    const existingGroup = groups.find(group => group.date === dateKey);
    if (existingGroup) {
      existingGroup.messages.push(message);
    } else {
      groups.push({
        date: dateKey,
        messages: [message]
      });
    }
    
    return groups;
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat header - more compact */}
      <div className="px-3 py-1.5 bg-white border-b border-gray-200 flex items-center flex-shrink-0">
        <UserAvatar 
          imageUrl={recipientImageUrl} 
          name={recipientName} 
          size="sm" 
          className="mr-2" 
        />
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{recipientName}</h2>
          <p className="text-xs text-gray-500">
            {isRefreshing ? 'Updating...' : `Last updated ${formatDistanceToNow(new Date(lastPolledAt.current), { addSuffix: true })}`}
          </p>
        </div>
      </div>
      
      {/* Message area - making sure it's properly contained with a fixed height calculation */}
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 relative bg-gray-50" 
        style={{ height: 'calc(100% - 80px)' }}
      >
        {isInitialLoading ? (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
            <p className="text-gray-500 text-sm">Loading messages...</p>
          </div>
        ) : isSelfMessaging ? (
          <div className="flex justify-center items-center h-full">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
              <div className="flex items-center justify-center mb-4 text-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Cannot message yourself</h3>
              <p className="text-gray-600 text-center">You cannot send messages to yourself. Try messaging another student or alumni.</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-md">
              <div className="flex items-center justify-center mb-4 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Error</h3>
              <p className="text-red-600 text-center">{error}</p>
              <div className="mt-4 text-center">
                <button
                  onClick={() => fetchMessages(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
              <div className="h-16 w-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
              <p className="text-gray-600 mb-6">No messages yet with {recipientName}. Send a message to start the conversation.</p>
              <p className="text-sm text-gray-500">You'll be the first to message!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Grouped messages by date */}
            {groupedMessages.map((group, groupIndex) => (
              <div key={group.date} className="mb-4">
                {/* Date divider */}
                <div className="flex items-center my-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <div className="mx-4 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {new Date(group.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                
                {/* Messages in this date group */}
                <div className="space-y-2">
                  {group.messages.map((message, index) => {
                    const isSender = message.sender_id === currentUserId;
                    // Check if this message is part of a sequence from the same sender
                    const isSequence = index > 0 && group.messages[index - 1].sender_id === message.sender_id;
                    
                    return (
                      <div
                        key={message.id || message._id}
                        className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Avatar - only show for first message in sequence from recipient */}
                        {!isSender && !isSequence && (
                          <div className="mr-1.5 self-end mb-0.5">
                            <UserAvatar
                              imageUrl={recipientImageUrl}
                              name={recipientName}
                              size="xs"
                            />
                          </div>
                        )}
                        
                        {/* Spacer for consistent alignment when avatar is hidden */}
                        {!isSender && isSequence && <div className="w-6 mr-1.5"></div>}
                        
                        {/* Message bubble */}
                        <div
                          className={`max-w-[75%] rounded-lg px-2.5 py-1.5 ${
                            isSender
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                          <div className={`text-xs mt-0.5 flex items-center justify-end ${
                            isSender ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span>{formatMessageTime(message.created_at)}</span>
                            {/* Read receipt indicator for sent messages */}
                            {isSender && message.read_by && (
                              <span className="ml-1 flex items-center">
                                {message.read_by.includes(recipientId) ? (
                                  <span className="inline-flex items-center text-xs">
                                    <CheckIcon className="h-3 w-3 ml-0.5" />
                                    <CheckIcon className="h-3 w-3 -ml-1.5" />
                                  </span>
                                ) : (
                                  <CheckIcon className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Avatar - only show for first message in sequence from sender */}
                        {isSender && !isSequence && (
                          <div className="ml-1.5 self-end mb-0.5">
                            <UserAvatar
                              imageUrl={currentUserImage}
                              name={currentUserName}
                              size="xs"
                            />
                          </div>
                        )}
                        
                        {/* Spacer for consistent alignment when avatar is hidden */}
                        {isSender && isSequence && <div className="w-6 ml-1.5"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {isRefreshing && (
              <div className="absolute top-2 right-2 p-1 bg-white rounded-full shadow">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input area */}
      <div className="p-1.5 bg-white border-t border-gray-200">
        <div className="flex space-x-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              resetPollingTimer();
            }}
            onFocus={resetPollingTimer}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            disabled={isSelfMessaging || isInitialLoading || !!error}
            className="flex-1 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-1 px-3 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSelfMessaging || isInitialLoading || !!error || isSending}
            className={`rounded-full p-2 ${
              newMessage.trim() && !isSelfMessaging && !isInitialLoading && !error && !isSending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-blue-200 rounded-full animate-spin"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 