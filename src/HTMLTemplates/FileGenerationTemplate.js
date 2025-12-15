const getArticleConversionErrorHTML = () => `
<div style="font-family: Arial; padding: 16px; border: 1px solid #f5c6cb; background-color: #fdecea;">
  <h3 style="color: #a94442;">⚠️ Article Conversion Failed</h3>
  <p>
    We could not convert this file into a web-ready article.
    The file appears too complex to process.
  </p>
  <p><strong>Next steps:</strong></p>
  <ul>
    <li>Simplify the document and try again</li>
    <li>Or upload a PDF version to the media library</li>
    <li>Add the PDF as a custom link in Airtable</li>
  </ul>
</div>
`;

const getUnsupportedFileTypeHTML = () => `
<div style="font-family: Arial; padding: 16px; border: 1px solid #ffeeba; background-color: #fff3cd;">
  <h3 style="color: #856404;">⚠️ Unsupported File Type</h3>

  <p>
    This file format cannot be converted into a web-ready article.
  </p>

  <p><strong>Supported formats:</strong></p>
  <ul>
    <li>Google Docs / DOCX</li>
    <li>PDF</li>
    <li>HTML</li>
  </ul>

  <p><strong>What you can do:</strong></p>
  <ul>
    <li>Export the document as a <strong>PDF</strong></li>
    <li>Upload the PDF to your media library</li>
    <li>Add it as a <strong>Custom Link</strong> in Airtable</li>
  </ul>

  <hr />
  <p style="font-size: 12px; color: #666;">
    Error Code: UNSUPPORTED_FILE_TYPE
  </p>
</div>
`;

const getCharacterLimitExceededHTML = (limit, actual) => `
<div style="font-family: Arial; padding: 16px; border: 1px solid #cce5ff; background-color: #e9f5ff;">
  <h3 style="color: #004085;">📄 Article Too Large to Convert</h3>

  <p>
    We could not convert this document into a web-ready article because
    the generated HTML exceeds the maximum allowed size.
  </p>

  <p>
    <strong>Maximum allowed:</strong> ${limit.toLocaleString()} characters<br/>
    <strong>Generated content:</strong> ${actual.toLocaleString()} characters
  </p>

  <p><strong>How to resolve this:</strong></p>
  <ul>
    <li>Split the document into multiple smaller articles</li>
    <li>Remove large images, tables, or repeated formatting</li>
    <li>Export the document as a <strong>PDF</strong></li>
    <li>Upload the PDF to the media library and add it as a custom link in Airtable</li>
  </ul>

  <hr />
  <p style="font-size: 12px; color: #666;">
    Error Code: ARTICLE_CONTENT_TOO_LARGE
  </p>
</div>
`;

module.exports = {
    getArticleConversionErrorHTML,
    getUnsupportedFileTypeHTML,
    getCharacterLimitExceededHTML,
};