import { useState, useEffect } from '../../packages/react'

interface Post {
  id: number;
  title: string;
  content: string;
}

export default function PostsTab() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
      const postsArray: Post[] = [];
      for (let i = 1; i <= 50; i++) {
        postsArray.push({
          id: i,
          title: `博文${i}`,
          content: `这是第${i}篇博文的内容...`
        });
      }
      setPosts(postsArray);
  }, []);

  return (
    <div>
      <h3>博文列表</h3>
      <ul>
        {posts.map(post => (
          <li key={post.id} style={{ marginBottom: '10px', padding: '5px', border: '1px solid #ccc' }}>
            <strong>{post.title}</strong> - {post.content}
          </li>
        ))}
      </ul>
    </div>
  );
} 