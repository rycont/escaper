<template>
  <div id="app">
    <a-input
      addonBefore="URI"
      @input="uri = $event.target.value"
      type="text"
      placeholder="URI를 입력해주세요. URL Scheme도 가능합니다."
    />
    <a-input
      addonBefore="제목"
      @input="title = $event.target.value"
      type="text"
      placeholder="표지에 표시될 이름을 입력해주세요."
    />
    <a-card size="small">
      <p>
        적정 해상도는 1000x1500px입니다. 지원 포맷: PNG, JPG(기기, 뷰어에 따라
        달라질 수 있습니다.)
      </p>
    </a-card>
    <a-upload @change="onChange" :beforeUpload="returnfalse">
      <a-button> <a-icon type="upload" /> 표지 업로드 </a-button>
    </a-upload>
    <a-button type="primary" @click="createEpub">
      저장하기
    </a-button>
  </div>
</template>

<style>
p {
  margin-bottom: 0px;
}
body {
  margin: 0px;
}
div#app {
  padding: 20px;
  max-width: 540px;
  margin: 80px auto 0 auto;
}
.ant-input-group-wrapper {
  margin-bottom: 10px;
}
.ant-card.ant-card-bordered.ant-card-small {
  margin-bottom: 10px;
}
.ant-upload.ant-upload-select.ant-upload-select-text {
  margin-bottom: 10px;
}
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Input, Upload, Button, Icon, message, Card } from 'ant-design-vue'
;[Input, Upload, Button, Icon, Card].map(e => Vue.use(e))

export default class App extends Vue {
  uri: String = ''
  title: String = ''
  coverfilename: string = ''
  coverMediaType: string = ''
  cover?: File = undefined
  zipper = new JSZip()
  onChange = ({ file }: { file: File }) => {
    if (!file) return
    this.cover = file
  }
  initZip() {
    this.zipper.file('mimetype', '')
    this.zipper.file(
      'META-INF/container.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
	<rootfiles>
		<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
	</rootfiles>
</container>`
    )
  }
  returnfalse = () => false
  createEpub = () => {
    this.initZip()
    message.success('성공적으로 생성되었습니다', 3)
    const { title, uri, zipper, cover } = this
    const content = this.content(title, cover)
    zipper.file('OEBPS/content.opf', content)
    const index = this.index(uri, title)
    zipper.file('OEBPS/index.html', index)
    if (cover) zipper.file(`OEBPS/${cover.name}`, cover)
    zipper
      .generateAsync({
        type: 'blob'
      })
      .then(e => saveAs(e, `${title}.epub`))
  }
  content = (
    title: String,
    cover?: File
  ) => `<?xml version="1.0" encoding="UTF-8"?>

<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="udocid">
	<metadata xmlns:opf="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">
		<dc:title>${title}</dc:title>
		<dc:creator opf:role="aut">Various Author</dc:creator>
		<dc:language>ko</dc:language>
		<dc:publisher>Various Pubs</dc:publisher>
		<dc:date opf:event="modification">2019-12-04</dc:date>
    <meta name="Sigil version" content="0.9.9"></meta>
    ${
      cover
        ? `<meta name="cover" content="cover" xmlns="http://purl.org/dc/elements/1.1/">
		</meta>`
        : ''
    }
	</metadata>
	<manifest>
    <item id="index" href="index.html" media-type="application/xhtml+xml" />
    ${
      cover
        ? `<item href="${cover.name}" id="cover" media-type="${cover.type}" />`
        : ''
    }
	</manifest>
	<spine toc="ncx">
		<itemref idref="index"></itemref>
	</spine>
	<guide></guide>
</package>`
  index = (uri: String, title: String) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${title}</title>
  <style>
    a {
      display: block;
      height: 100vh;
      border: 3px solid black;
      box-sizing: border-box;
      text-align: center;
      line-height: 80px;
    }
  </style>
</head>
<body>
  <a href="${uri}">${title}(${uri})로 이동합니다. 직접 이동</a>
</body>
</html>`
}
</script>
