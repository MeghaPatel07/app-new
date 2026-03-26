import { Timestamp, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { marked } from 'marked';

// TypeScript interface for Blog data structure matching actual Firebase structure
export interface BlogModel {
  docId: string;
  isVisible: boolean;
  show: boolean;
  metaTitle: string;
  lowerTitle: string;
  markDown: string;
  htmlString: string;
  tags: string[];
  permalink: string;
  publishedOn: Date; // Firebase uses publishedOn instead of createdAt
  updatedAt: Date;
  imageLinks: string[];
  otherBlogs: string[];
  thumbnail: string;
  metaDesc?: string; // Optional meta description
}

// TypeScript class implementation with methods
export class BlogModelClass implements BlogModel {
  docId: string;
  isVisible: boolean;
  show: boolean;
  metaTitle: string;
  lowerTitle: string;
  markDown: string;
  htmlString: string;
  tags: string[];
  permalink: string;
  publishedOn: Date; // Firebase uses publishedOn instead of createdAt
  updatedAt: Date;
  imageLinks: string[];
  otherBlogs: string[];
  thumbnail: string;
  metaDesc?: string; // Optional meta description

  constructor(data: BlogModel) {
    this.docId = data.docId;
    this.isVisible = data.isVisible;
    this.show = data.show;
    this.metaTitle = data.metaTitle;
    this.lowerTitle = data.lowerTitle;
    this.markDown = data.markDown;
    this.htmlString = data.htmlString;
    this.tags = data.tags;
    this.permalink = data.permalink;
    this.publishedOn = data.publishedOn;
    this.updatedAt = data.updatedAt;
    this.imageLinks = data.imageLinks;
    this.otherBlogs = data.otherBlogs;
    this.thumbnail = data.thumbnail;
    this.metaDesc = data.metaDesc;
  }

  // Converts BlogModel instance to JSON for Firestore
  toJson(): Record<string, any> {
    return {
      docId: this.docId,
      isVisible: this.isVisible,
      show: this.show,
      metaTitle: this.metaTitle,
      lowerTitle: this.lowerTitle,
      markDown: this.markDown,
      htmlString: this.htmlString,
      tags: this.tags,
      permalink: this.permalink,
      publishedOn: Timestamp.fromDate(this.publishedOn),
      updatedAt: Timestamp.fromDate(this.updatedAt),
      imageLinks: this.imageLinks,
      otherBlogs: this.otherBlogs,
      thumbnail: this.thumbnail,
      metaDesc: this.metaDesc,
    };
  }

  // Creates BlogModel instance from JSON map
  static fromJson(json: Record<string, any>): BlogModelClass {
    return new BlogModelClass({
      docId: json.docId || '',
      isVisible: Boolean(json.isVisible),
      show: Boolean(json.show),
      metaTitle: json.metaTitle || '',
      lowerTitle: json.lowerTitle || '',
      markDown: json.markDown || '',
      htmlString: json.htmlString || '',
      tags: Array.isArray(json.tags) ? json.tags : [],
      permalink: json.permalink || '',
      publishedOn: json.publishedOn instanceof Timestamp 
        ? json.publishedOn.toDate() 
        : json.publishedOn instanceof Date 
        ? json.publishedOn 
        : new Date(),
      updatedAt: json.updatedAt instanceof Timestamp 
        ? json.updatedAt.toDate() 
        : json.updatedAt instanceof Date 
        ? json.updatedAt 
        : new Date(),
      imageLinks: Array.isArray(json.imageLinks) ? json.imageLinks : [],
      otherBlogs: Array.isArray(json.otherBlogs) ? json.otherBlogs : [],
      thumbnail: json.thumbnail || '',
      metaDesc: json.metaDesc || '',
    });
  }

  // Creates BlogModel instance from Firestore document snapshot
  static fromFirestore(doc: DocumentSnapshot | QueryDocumentSnapshot): BlogModelClass {
    const data = doc.data();
    if (!data) {
      throw new Error(`No data found in document ${doc.id}`);
    }

    console.log('Parsing blog document:', doc.id, data);

    // Handle date fields - Firebase uses publishedOn instead of createdAt
    let publishedOn: Date;
    if (data.publishedOn instanceof Timestamp) {
      publishedOn = data.publishedOn.toDate();
    } else if (data.publishedOn instanceof Date) {
      publishedOn = data.publishedOn;
    } else if (typeof data.publishedOn === 'string') {
      publishedOn = new Date(data.publishedOn);
    } else {
      publishedOn = new Date();
    }

    let updatedAt: Date;
    if (data.updatedAt instanceof Timestamp) {
      updatedAt = data.updatedAt.toDate();
    } else if (data.updatedAt instanceof Date) {
      updatedAt = data.updatedAt;
    } else if (typeof data.updatedAt === 'string') {
      updatedAt = new Date(data.updatedAt);
    } else {
      updatedAt = new Date();
    }

    return new BlogModelClass({
      docId: doc.id,
      isVisible: Boolean(data.isVisible),
      show: Boolean(data.show),
      metaTitle: data.metaTitle || '',
      lowerTitle: data.lowerTitle || '',
      markDown: data.markDown || '',
      htmlString: data.htmlString || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      permalink: data.permalink || '',
      publishedOn,
      updatedAt,
      imageLinks: Array.isArray(data.imageLinks) ? data.imageLinks : [],
      otherBlogs: Array.isArray(data.otherBlogs) ? data.otherBlogs : [],
      thumbnail: data.thumbnail || '',
      metaDesc: data.metaDesc || '',
    });
  }

  // Helper methods
  getFormattedDate(): string {
    return this.publishedOn.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getMainImage(): string {
    // Check if thumbnail is a valid URL
    if (this.thumbnail && this.thumbnail.trim() !== '') {
      // If it's a Google Drive URL, convert it to direct image URL
      if (this.thumbnail.includes('drive.google.com')) {
        const fileId = this.thumbnail.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        if (fileId) {
          return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
      }
      return this.thumbnail;
    }
    
    // Check if imageLinks has valid URLs
    if (this.imageLinks && this.imageLinks.length > 0) {
      const firstImage = this.imageLinks[0];
      if (firstImage && firstImage.trim() !== '') {
        // If it's a Google Drive URL, convert it to direct image URL
        if (firstImage.includes('drive.google.com')) {
          const fileId = firstImage.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
          if (fileId) {
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
          }
        }
        return firstImage;
      }
    }
    
    // Fallback to placeholder
    return '/images/celebration-new-1.jpg';
  }

  isPublished(): boolean {
    // For now, consider blogs published if they are visible
    // The 'show' field seems to be used differently in your Firebase data
    return this.isVisible;
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  getExcerpt(maxLength: number = 150): string {
    // Use markDown content for excerpt
    const content = this.markDown || this.htmlString || '';
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength).trim() + '...';
  }

  getSlug(): string {
    return this.permalink || this.lowerTitle || this.metaTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  getEstimatedReadTime(): string {
    const wordsPerMinute = 200;
    const wordCount = (this.markDown || this.htmlString || '').split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  }

  isNew(): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.publishedOn > thirtyDaysAgo;
  }

  isTrending(): boolean {
    // Consider trending if created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.publishedOn > sevenDaysAgo;
  }

  // Get title for display (use metaTitle as primary, fallback to lowerTitle)
  getTitle(): string {
    return this.metaTitle || this.lowerTitle || 'Untitled Blog';
  }

  // Get content for display (prefer markDown, fallback to htmlString)
  getContent(): string {
    let content = '';
    
    // If we have markdown content, convert it to HTML
    if (this.markDown) {
      try {
        // Handle both sync and async versions of marked
        const markedResult = marked(this.markDown);
        content = typeof markedResult === 'string' ? markedResult : this.markDown;
        console.log('🔍 Converted markdown to HTML');
      } catch (error) {
        console.error('❌ Error converting markdown:', error);
        content = this.markDown; // Fallback to raw markdown
      }
    } else if (this.htmlString) {
      // Use the HTML string directly
      content = this.htmlString;
    }
    
    // Clean up the content - remove any problematic HTML attributes or classes
    // that might cause rendering issues
    content = content
      // Remove any inline styles that might conflict with our CSS
      .replace(/style="[^"]*"/g, '')
      // Remove any problematic class names that might cause CSS conflicts
      .replace(/class="[^"]*pw-post-body-paragraph[^"]*"/g, 'class="blog-paragraph"')
      // Remove any other problematic classes (like the long class string the user mentioned)
      .replace(/class="[^"]*wi wj sg wk b wl wm wn wo wp wq wr ws wt wu wv ww wx wy wz xa xb xc[^"]*"/g, 'class="blog-paragraph"')
      // Remove any other long class strings that might cause issues
      .replace(/class="[^"]{50,}[^"]*"/g, 'class="blog-paragraph"')
      // Clean up any empty class attributes
      .replace(/class="\s*"/g, '')
      // Remove any IDs that might cause conflicts
      .replace(/id="[^"]*"/g, '')
      // Ensure proper paragraph structure
      .replace(/<p\s*>/g, '<p class="blog-paragraph">')
      // Clean up any extra whitespace
      .replace(/\s+/g, ' ')
      // Remove any empty paragraphs
      .replace(/<p[^>]*>\s*<\/p>/g, '')
      // Ensure proper spacing between elements
      .replace(/>\s+</g, '><')
      .trim();
    
    console.log('🔍 Blog content processing:', {
      originalMarkDown: this.markDown?.substring(0, 100) + '...',
      originalHtmlString: this.htmlString?.substring(0, 100) + '...',
      processedContent: content.substring(0, 100) + '...',
      contentLength: content.length,
      hasProblematicClasses: content.includes('pw-post-body-paragraph') || content.includes('wi wj sg wk'),
      contentType: this.markDown ? 'markdown' : 'html'
    });
    
    return content;
  }

  // Async version of getContent for better handling of marked library
  async getContentAsync(): Promise<string> {
    let content = '';
    
    // If we have markdown content, convert it to HTML
    if (this.markDown) {
      try {
        // Use marked.parse for async processing
        content = await marked.parse(this.markDown);
        console.log('🔍 Converted markdown to HTML (async)');
      } catch (error) {
        console.error('❌ Error converting markdown (async):', error);
        content = this.markDown; // Fallback to raw markdown
      }
    } else if (this.htmlString) {
      // Use the HTML string directly
      content = this.htmlString;
    }
    
    // Apply the same cleaning as the sync version
    content = content
      .replace(/style="[^"]*"/g, '')
      .replace(/class="[^"]*pw-post-body-paragraph[^"]*"/g, 'class="blog-paragraph"')
      .replace(/class="[^"]*wi wj sg wk b wl wm wn wo wp wq wr ws wt wu wv ww wx wy wz xa xb xc[^"]*"/g, 'class="blog-paragraph"')
      .replace(/class="[^"]{50,}[^"]*"/g, 'class="blog-paragraph"')
      .replace(/class="\s*"/g, '')
      .replace(/id="[^"]*"/g, '')
      .replace(/<p\s*>/g, '<p class="blog-paragraph">')
      .replace(/\s+/g, ' ')
      .replace(/<p[^>]*>\s*<\/p>/g, '')
      .replace(/>\s+</g, '><')
      .trim();
    
    return content;
  }
}

// Utility functions for blog operations
export const blogUtils = {
  // Filter blogs by visibility
  filterVisible: (blogs: BlogModelClass[]): BlogModelClass[] => {
    return blogs.filter(blog => blog.isVisible && blog.show);
  },

  // Sort blogs by creation date (newest first)
  sortByDate: (blogs: BlogModelClass[]): BlogModelClass[] => {
    return blogs.sort((a, b) => b.publishedOn.getTime() - a.publishedOn.getTime());
  },

  // Filter blogs by tag
  filterByTag: (blogs: BlogModelClass[], tag: string): BlogModelClass[] => {
    return blogs.filter(blog => blog.hasTag(tag));
  },

  // Search blogs by title or content
  searchBlogs: (blogs: BlogModelClass[], searchTerm: string): BlogModelClass[] => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return blogs.filter(blog => 
      blog.getTitle().toLowerCase().includes(lowerSearchTerm) ||
      blog.getContent().toLowerCase().includes(lowerSearchTerm) ||
      blog.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
    );
  },

  // Get all unique tags from blogs
  getAllTags: (blogs: BlogModelClass[]): string[] => {
    const tagSet = new Set<string>();
    blogs.forEach(blog => {
      blog.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  },

  // Get recent blogs
  getRecentBlogs: (blogs: BlogModelClass[], limit: number = 6): BlogModelClass[] => {
    return blogUtils.sortByDate(blogs).slice(0, limit);
  },

  // Get new blogs (created in last 30 days)
  getNewBlogs: (blogs: BlogModelClass[]): BlogModelClass[] => {
    return blogs.filter(blog => blog.isNew());
  },

  // Get trending blogs (created in last 7 days)
  getTrendingBlogs: (blogs: BlogModelClass[]): BlogModelClass[] => {
    return blogs.filter(blog => blog.isTrending());
  },
}; 