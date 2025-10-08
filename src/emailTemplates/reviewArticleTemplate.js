const reviewArticleTemplate = (reviewerName, interfaceLink, articles) => {
  return `
    <html>
        <body>
            Hello ${reviewerName},<br/><br/>
            You have been requested to review following article:<br/><br/>
                  <table border="1" cellpadding="10">
                      <tr>
                          <th>Article Title</th>
                          <th>Version</th>
                          <th>Publisher</th>
                      </tr>
            ${articles.map(
              (article) => `
                <tr>
                    <td>${article.fields["Article Title"]}</td>
                    <td>${article.fields["Version"]}</td>
                    <td>${article.fields["Publisher"]}</td>
                </tr>
                `
            )}
            </table>
            <br/>
            <b>
            Please review your articles <a href=${interfaceLink}>Click Here</a><br/>
            Thanks,<br/>
            Remedy Connect Team
            </b>
        </body>
    </html>`;
};

module.exports = { reviewArticleTemplate };
