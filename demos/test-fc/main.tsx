import { useState } from '../../packages/react'
import { createRoot } from '../../packages/react-dom/src/root'

import AboutTab from '../test/AboutTab'
import PostsTab from '../test/PostsTab'
import ContactTab from '../test/ContactTab'
import TabButton from '../test/TabButton'

export default function TabContainer() {
  const [tab, setTab] = useState('about');

  function selectTab(nextTab: string) {
    setTab(nextTab);
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
      博文
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
    <div className="tab-container">
      <div className="tab-buttons">
        {aboutButton}
        {postsButton}
        {contactButton}
      </div>
      <hr />
      <div className="tab-content">
        {content}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'))
root.render(<TabContainer />) 