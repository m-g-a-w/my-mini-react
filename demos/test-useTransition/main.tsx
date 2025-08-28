import * as React from '../../packages/react'
import { useState, useTransition, createElement } from '../../packages/react'
import { createRoot } from '../../packages/react-dom/src/root'
import AboutTab from './AboutTab'
import PostsTab from './PostsTab'
import ContactTab from './ContactTab'
import TabButton from './TabButton'

export default function TabContainer() {
  const [tab, setTab] = useState('about');
  const [isPending, startTransition] = useTransition();

  function selectTab(nextTab: string) {
    if (nextTab === 'posts') {
      // 使用 startTransition 来处理 posts 标签的切换
      // 因为 posts 标签有大量内容需要渲染
      startTransition(() => {
        setTab(nextTab);
      });
    } else {
      // 其他标签直接切换，不使用 transition
      setTab(nextTab);
    }
  }

  // 创建标签按钮
  const aboutButton = (
    <TabButton 
      isActive={tab === 'about'}
      onClick={() => selectTab('about')}
    >
      关于
    </TabButton>
  );
  
  const postsButton = (
    <TabButton 
      isActive={tab === 'posts'}
      onClick={() => selectTab('posts')}
    >
      博文 {isPending && tab === 'posts' && '(加载中...)'}
    </TabButton>
  );
  
  const contactButton = (
    <TabButton 
      isActive={tab === 'contact'}
      onClick={() => selectTab('contact')}
    >
      联系
    </TabButton>
  );

  // 创建内容区域
  let content;
  if (tab === 'about') {
    content = <AboutTab />;
  } else if (tab === 'posts') {
    content = <PostsTab />;
  } else if (tab === 'contact') {
    content = <ContactTab />;
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* 头部标题 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '2.5em', 
          fontWeight: '300' 
        }}>
          startTransition 效果演示
        </h1>
      </div>

      {/* 说明区域 */}
      <div style={{
        background: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>"关于"</strong> 和 <strong>"联系"</strong> 标签：立即响应，无延迟
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>"博文"</strong> 标签：使用 startTransition，在渲染大量内容时保持UI响应性
          </li>
          <li style={{ marginBottom: '8px' }}>
            点击"博文"标签后，可以立即切换到其他标签
          </li>
        </ul>
      </div>

      {/* 主要内容区域 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div className="tab-container" style={{ padding: '30px' }}>
          <div className="tab-buttons" style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '30px',
            borderBottom: '2px solid #eee',
            paddingBottom: '20px'
          }}>
            {aboutButton}
            {postsButton}
            {contactButton}
          </div>
          
          <div className="tab-content" style={{
            minHeight: '400px',
            background: '#fafafa',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #e9ecef'
          }}>
            {content}
          </div>
        </div>
      </div>

      {/* 过渡状态指示器 */}
      {isPending && (
        <div style={{ 
          position: 'fixed', 
          top: '20px', 
          right: '20px', 
          background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)', 
          color: 'white', 
          padding: '12px 20px', 
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
          zIndex: 1000,
          animation: 'fadeInOut 2s infinite'
        }}>
        </div>
      )}

      {/* 添加CSS动画 */}
      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<TabContainer />);
} 