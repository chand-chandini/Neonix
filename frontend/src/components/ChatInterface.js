import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaPaperPlane, FaPlus, FaTrash, FaRobot, FaUser, FaSpinner } from 'react-icons/fa';
import styled from 'styled-components';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: #1a1a1a;
  color: #ffffff;
`;

const Sidebar = styled.div`
  width: 280px;
  background: #2d2d2d;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #3d3d3d;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #6c63ff;
  margin-bottom: 20px;
  text-align: center;
  padding: 10px;
  border-bottom: 1px solid #3d3d3d;
`;

const NewChatButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    background: #5a52d5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.div`
  padding: 12px;
  margin: 5px 0;
  background: ${props => props.active ? '#3d3d3d' : 'transparent'};
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;

  &:hover {
    background: #3d3d3d;
  }
`;

const ConversationTitle = styled.div`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: #ff6b6b;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const Message = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 10px;
  background: ${props => props.role === 'user' ? '#2d2d2d' : '#1e1e1e'};
  border: 1px solid #3d3d3d;
  max-width: 80%;
  margin-left: ${props => props.role === 'user' ? 'auto' : '0'};
`;

const MessageContent = styled.div`
  flex: 1;
  line-height: 1.6;
  
  p {
    margin: 0 0 10px 0;
  }
  
  code {
    background: #2d2d2d;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 14px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 20px;
  background: #2d2d2d;
  border-radius: 12px;
  margin-top: 20px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  background: #1e1e1e;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #6c63ff;
  }
  
  &:disabled {
    opacity: 0.5;
  }
`;

const SendButton = styled.button`
  padding: 12px 24px;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover:not(:disabled) {
    background: #5a52d5;
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  
  h1 {
    font-size: 48px;
    margin-bottom: 20px;
  }
  
  h2 {
    font-size: 32px;
    margin-bottom: 10px;
    color: #6c63ff;
  }
  
  p {
    font-size: 18px;
  }
`;

const CodeBlock = ({ language, children }) => {
  return (
    <SyntaxHighlighter
      style={vscDarkPlus}
      language={language || 'javascript'}
      PreTag="div"
      customStyle={{
        borderRadius: '8px',
        padding: '15px',
        margin: '10px 0'
      }}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
};

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/conversations`);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/${conversationId}`);
      setMessages(response.data.messages);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat/send`, {
  message: input,
  conversationId: currentConversationId
}, {
  headers: {
    'Content-Type': 'application/json'
  }
});

      const aiMessage = {
        role: 'assistant',
        content: response.data.message
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (!currentConversationId) {
        setCurrentConversationId(response.data.conversationId);
        fetchConversations();
      } else {
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const newConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput('');
  };

  const deleteConversation = async (conversationId) => {
    if (!window.confirm('Delete this conversation?')) return;
    
    try {
      await axios.delete(`${API_URL}/conversations/${conversationId}`);
      fetchConversations();
      if (currentConversationId === conversationId) {
        newConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Container>
      <Sidebar>
        <Logo>✨ Neonix AI</Logo>
        <NewChatButton onClick={newConversation}>
          <FaPlus /> New Chat
        </NewChatButton>
        <ConversationList>
          {conversations.map(conv => (
            <ConversationItem
              key={conv._id}
              active={currentConversationId === conv._id}
            >
              <ConversationTitle onClick={() => loadConversation(conv._id)}>
                {conv.title}
              </ConversationTitle>
              <DeleteButton onClick={() => deleteConversation(conv._id)}>
                <FaTrash size={14} />
              </DeleteButton>
            </ConversationItem>
          ))}
        </ConversationList>
      </Sidebar>

      <ChatArea>
        <MessagesContainer>
          {messages.length === 0 ? (
            <WelcomeContainer>
              <h1>🚀</h1>
              <h2>Neonix AI</h2>
              <p>Your intelligent AI assistant</p>
            </WelcomeContainer>
          ) : (
            messages.map((msg, idx) => (
              <Message key={idx} role={msg.role}>
                <div style={{ marginTop: '5px' }}>
                  {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                </div>
                <MessageContent>
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <CodeBlock language={match[1]} {...props}>
                            {String(children).replace(/\n$/, '')}
                          </CodeBlock>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </MessageContent>
              </Message>
            ))
          )}
          {loading && (
            <Message role="assistant">
              <div><FaRobot /></div>
              <div>
                <FaSpinner className="spinner" />
                <span style={{ marginLeft: '10px' }}>Thinking...</span>
              </div>
            </Message>
          )}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <InputContainer>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={loading}
          />
          <SendButton onClick={sendMessage} disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
            {loading ? 'Sending...' : 'Send'}
          </SendButton>
        </InputContainer>
      </ChatArea>
    </Container>
  );
}

export default ChatInterface;