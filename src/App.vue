<template>
  <div id="app">
    <a-card size="small" type="info">
      <p>Escaper에 오신걸 환영합니다.</p>
      <p>
        표지의 적정 해상도는 1000x1500px입니다. 지원 포맷: PNG, JPG(기기, 뷰어에
        따라 달라질 수 있습니다.). 표지를 넣지 않으면 각 뷰어별로 기본 이미지가
        출력됩니다
      </p>
      <p>URI Scheme 사용 가능합니다.</p>
      <p>
        (페이퍼 한정) "바로 열기" 옵션은 새 창이 아닌 리디 뷰어 내부에서
        열립니다. 저도 아직 이걸 언제 써야할지 모르겠습니다. 일반적으로는 끄고
        사용하세요.
      </p>
    </a-card>
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
    <a-row>
      <a-col :span="12">
        <a-upload @change="onChange" :beforeUpload="returnfalse">
          <a-button>
            <a-icon type="upload" />표지 업로드
          </a-button>
        </a-upload>
      </a-col>
      <a-col :span="12">
        <img :src="previewData" alt />
      </a-col>
    </a-row>
    <div>
      <a-checkbox @change="directlyOpen = $event.target.checked">바로 열기 사용</a-checkbox>
    </div>
    <a-button type="primary" @click="createEpub">저장하기</a-button>
    <a-card size="small">
      <p>
        아직 부족한것이 많습니다. 개발자시다면
        <a href="https://github.com/wjdgks1224/escaper">Github Repo</a>에 기여
        부탁드리겠습니다. PR은 환영입니다!
      </p>
    </a-card>
  </div>
</template>

<script lang="ts">
import { Vue } from 'vue-property-decorator'
import Component from 'vue-class-component'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import {
  Input,
  Upload,
  Button,
  Icon,
  message,
  Card,
  Checkbox,
  Row,
  Col
} from 'ant-design-vue'
;[Input, Upload, Button, Icon, Card, Checkbox, Row, Col].map(e => Vue.use(e))

@Component
export default class App extends Vue {
  public uri: string = ''
  title: string = ''
  coverfilename: string = ''
  coverMediaType: string = ''
  public directlyOpen: boolean = false
  public previewData: string = ''
  cover?: File = undefined
  zipper = new JSZip()
  count: number = 0
  mounted() {
    if (!window.matchMedia('(display-mode: standalone)').matches) return
    if (innerWidth > 540) resizeTo(540, 665)
    
  }
  onChange({ file }: { file: File }) {
    if (!file) return
    this.cover = file
    this.previewData = window.URL.createObjectURL(file)
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
  createEpub() {
    this.initZip()
    const { title, uri, zipper, cover, directlyOpen } = this
    if(!uri) {
      message.error('URI를 입력해주세요')
      return
    }
    if (!title) {
      message.error('제목을 입력해주세요')
      return
    }
    if(!cover) {
      message.info('표지를 넣지 않으면 기본 이미지가 출력됩니다')
    }
    const content = this.content(title, cover)
    zipper.file('OEBPS/content.opf', content)
    const index = this.index(uri, title, directlyOpen)
    zipper.file('OEBPS/index.html', index)
    if (cover) zipper.file(`OEBPS/${cover.name}`, cover)
    zipper
      .generateAsync({
        type: 'blob'
      })
      .then(e => {
        saveAs(e, `${title}.epub`)
        message.success('성공적으로 생성되었습니다', 3)
      })
  }
  content = (
    title: string,
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
  index = (
    uri: string,
    title: string,
    directlyOpen: boolean
  ) => `<!DOCTYPE html>
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
      padding-top: 50px;
    }
  </style>
</head>
<body>
  <a id="a" href="${uri}">${title}(${uri})로 이동하기: [테두리 안쪽 아무 것이나 클릭하세요]</a>
  ${
    directlyOpen
      ? `<script>
    document.getElementById('a').click()`
      : ''
  }
</body>
</html>`
}
</script>


<style>
body {
  margin: 0px;
  padding-top: 80px;
  box-sizing: border-box;
}
div#app {
  padding: 20px;
  max-width: 540px;
  margin: 0 auto 0 auto;
}
.ant-input-group-wrapper,
.ant-card.ant-card-bordered.ant-card-small,
.ant-upload.ant-upload-select.ant-upload-select-text,
.ant-checkbox-wrapper,
.ant-btn {
  margin-bottom: 10px;
}
.ant-card {
  border-radius: 4px;
}
.ant-card-type-info {
  background-color: rgb(230, 247, 255);
  border: 1px solid rgb(145, 213, 255);
  color: rgb(24, 144, 255);
}
.ant-card-body {
  padding-bottom: 2px !important;
}
.ant-card-type-info .ant-card-body a {
  color: #ff6f61;
}
img {
  width: 100%;
  border-radius: 12px;
}
@media screen and (max-width: 800px) {
  body {
    padding-top: 20px;
  }
}
@media screen and (max-width: 540px) {
  body {
    padding-top: 0px;
  }
}
</style>
