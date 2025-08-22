import { useState, useEffect } from '../../packages/react'

interface Post {
  id: number;
  title: string;
  content: string;
}

export default function PostsTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟异步加载数据
    const timer = setTimeout(() => {
      setPosts([
        { id: 1, title: '第一篇博文', content: '这是第一篇博文的内容...' },
        { id: 2, title: '第二篇博文', content: '这是第二篇博文的内容...' },
        { id: 3, title: '第三篇博文', content: '这是第三篇博文的内容...' }
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div>正在加载博文...</div>;
  }

  return (
    <div>
      <h3>博文列表</h3>
      {posts.map(post => (
        <div key={post.id} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h4>{post.title}</h4>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
} 