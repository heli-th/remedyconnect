const reviewArticleTemplate = (reviewerName, articles) => {
  return `
    <html>
        <body>
            Hello ${reviewerName},<br/><br/>
            You have been requested to review following article:<br/><br/>
                  <table border="1" cellpadding="10">
                      <tr>
                          <th>Article Title</th>
                          <th>Article Link</th>
                          <th>Version</th>
                          <th>Categories</th>
                      </tr>
            ${articles.map(
              (article) => `
                <tr>
                    <td>${article.fields["Article Title"]}</td>
                    <td><a href="${article.fields["Article URL"]}">click here</a></td>
                    <td>${article.fields["version"]}</td>
                    <td>${article.fields["categories"]}</td>
                </tr>
                `
            )}
            </table>
            <br/>
            <b>
            Please review your articles<br/>
            Thanks,<br/>
            Remedy Connect Team
            </b>
        </body>
    </html>`;
};

module.exports = { reviewArticleTemplate };
