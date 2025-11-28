const BlogPost = require('../models/BlogPost.cjs')

exports.getBlogPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 })
    res.json({ success: true, data: posts })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch blog posts' })
  }
}

exports.getBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found' })
    }
    res.json({ success: true, data: post })
  } catch (error) {
    console.error('Error fetching blog post:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch blog post' })
  }
}

exports.createBlogPost = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      author,
      category,
      image,
      readTime,
      date,
      isFeatured,
      status,
      tags
    } = req.body

    const blogPost = await BlogPost.create({
      title,
      excerpt,
      content,
      author,
      category,
      image,
      readTime,
      date,
      isFeatured,
      status,
      tags
    })

    res.json({ success: true, data: blogPost })
  } catch (error) {
    console.error('Error creating blog post:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to create blog post' })
  }
}

exports.updateBlogPost = async (req, res) => {
  try {
    const updated = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Blog post not found' })
    }
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating blog post:', error)
    res.status(500).json({ success: false, message: 'Failed to update blog post' })
  }
}

exports.deleteBlogPost = async (req, res) => {
  try {
    const deleted = await BlogPost.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Blog post not found' })
    }
    res.json({ success: true, message: 'Blog post deleted' })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    res.status(500).json({ success: false, message: 'Failed to delete blog post' })
  }
}

