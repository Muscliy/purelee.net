module.exports = {
  title: '向上人生',
  description: "路上的幸福时光",
  base: '/',
  dest: "/dist",
  evergreen: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'author', content: 'leehudev@gmail.com' }],
    ['meta', { name: 'copyright', content: '网站内容版权所有，转载请注明出处' }],
    ['meta', { name: "keywords", content: "m-less, less, mixins, 常用 mixins 文件, mixins 总结, mixins 整理, less 总结整理, less 技巧, css 简写, 前端技巧, 前端总结, 前端分享, www.purelee.net" }]
  ],
  theme: 'ououe',
  themeConfig: {
    cover: '/img/cover.jpg',
    postTime: {
      createTime: '创建时间',
      lastUpdated: '最后修改'
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Blog', link: '/posts/' },
      { text: 'Tool', link: '/tools/' },
      { text: 'Tags', link: '/tag/' },
      { text: 'Categories', link: '/category/'},
      { text: 'About', link: '/about/' }
    ],
    footer: [
      { text: 'Github', link: 'https://github.com/Muscliy' }
    ]
  },

  markdown: {
    lineNumbers: true
  },
  postcss: {
    plugins: [
      require('postcss-propro'),
      require('postcss-flex-alias'),
      require('autoprefixer')
    ]
  },
  plugins: {
    '@vuepress/last-updated': {
      transformer: (timestamp, lang) => {
        return new Date(timestamp).toISOString()
      }
    },
    'blog-multidir': {
      postsDir: {
        posts: 'posts/:year/:month/:day/:slug'
      }
    },
    'reading-progress': {
      readingDir: ['posts', 'lib']
    },
    'sitemap': {
      hostname: 'https://www.purelee.net',
      changefreq: 'weekly'
    }
  }
}
