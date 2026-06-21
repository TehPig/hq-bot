class Embed {
  constructor() {
    this.title = '';
    this.description = '';
    this.url = '';
    this.color = 0x5865F2;
    this.timestamp = '';
    this.footer = {};
    this.image = {};
    this.thumbnail = {};
    this.author = {};
    this.fields = [];
  }

  setTitle(title) { this.title = title; return this; }
  setDescription(desc) { this.description = desc; return this; }
  setURL(url) { this.url = url; return this; }
  setColor(color) { this.color = parseInt('0x' + color.replace('#', ''), 16); return this; }
  setTimestamp(ts) { this.timestamp = ts; return this; }
  setFooter(text, iconURL) { this.footer = { text, iconURL }; return this; }
  setImage(url) { this.image = { url }; return this; }
  setThumbnail(url) { this.thumbnail = { url }; return this; }
  setAuthor(name, iconURL, url) { this.author = { name, iconURL, url }; return this; }
  addFields(fields) { this.fields = fields; return this; }

  build() {
    return {
      title: this.title,
      description: this.description,
      url: this.url,
      color: this.color,
      timestamp: this.timestamp,
      footer: this.footer,
      image: this.image,
      fields: this.fields,
      author: this.author,
      thumbnail: this.thumbnail,
    };
  }

  from(data) {
    Object.assign(this, data);
    return this;
  }
}

export default Embed;
