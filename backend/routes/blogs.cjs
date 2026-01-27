const express = require('express')
const router = express.Router()
const { adminAuth } = require('../middleware/auth.cjs')
const {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
} = require('../controllers/blogController.cjs')

router.get('/', getBlogPosts)
router.get('/:id', getBlogPost)
router.post('/', adminAuth, createBlogPost)
router.put('/:id', adminAuth, updateBlogPost)
router.delete('/:id', adminAuth, deleteBlogPost)

module.exports = router

