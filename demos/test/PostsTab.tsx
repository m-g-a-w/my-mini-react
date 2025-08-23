import { useState, useEffect } from '../../packages/react'

interface Post {
  id: number;
  title: string;
  content: string;
  tags: string[];
  author: string;
  date: string;
  likes: number;
}

export default function PostsTab() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
      const postsArray: Post[] = [];
      const tags = ['React', 'JavaScript', 'TypeScript', '前端', '后端', 'AI', '机器学习', 'Web开发'];
      const authors = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];
      
      for (let i = 1; i <= 100; i++) {
        postsArray.push({
          id: i,
          title: `博文${i}: ${tags[i % tags.length]}相关技术分享`,
          content: `这是第${i}篇博文的详细内容。${'这是一段很长的内容，用来模拟复杂的渲染过程。'.repeat(i % 5 + 1)}`,
          tags: [tags[i % tags.length], tags[(i + 1) % tags.length], tags[(i + 2) % tags.length]],
          author: authors[i % authors.length],
          date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
          likes: Math.floor(Math.random() * 1000)
        });
      }
      setPosts(postsArray);
  }, []);

  // 模拟复杂的渲染计算
  const renderPost = (post: Post) => {
    // 模拟一些计算密集型操作
    const complexCalculation = () => {
      let result = 0;
      for (let i = 0; i < 1000; i++) {
        result += Math.sqrt(i) * Math.sin(i);
      }
      return result;
    };
    
    // 执行计算（在实际应用中这可能是虚拟的）
    complexCalculation();
    
    return (
      <div key={post.id} style={{ 
        marginBottom: '15px', 
        padding: '15px', 
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{post.title}</h4>
        <p style={{ margin: '0 0 10px 0', color: '#666', lineHeight: '1.5' }}>{post.content}</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {post.tags.map(tag => (
            <span key={tag} style={{
              backgroundColor: '#e1f5fe',
              color: '#0277bd',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '12px',
          color: '#888'
        }}>
          <span>作者: {post.author}</span>
          <span>日期: {post.date}</span>
          <span>👍 {post.likes}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ 
        marginBottom: '20px', 
        color: '#333',
        borderBottom: '2px solid #2196f3',
        paddingBottom: '10px'
      }}>
        博文列表 ({posts.length} 篇)
      </h3>
      <div style={{ 
        maxHeight: '600px', 
        overflowY: 'auto',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        {posts.map(renderPost)}
      </div>
    </div>
  );
} 