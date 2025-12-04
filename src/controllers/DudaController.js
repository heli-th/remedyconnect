const axios = require("axios");
const RESTRESPONSE = require("../utils/RESTRESPONSE");

const uploadKenticoFileOnDuda = async (req, res) => {
    const { fileSrc, dudaId } = req.body;
    const auth = "Y2U0ZTk5NjZiNTp4RFloaDZmREhIZlo";

    if (!fileSrc)
        return res.status(400).send(RESTRESPONSE(false, "fileSrc is required"));
    if (!dudaId)
        return res.status(400).send(RESTRESPONSE(false, "dudaId is required"));

    try {
        const url = `https://api.duda.co/api/sites/multiscreen/resources/${dudaId}/upload`;

        const payload = [
            {
                src: fileSrc,
                resource_type: 'FILE',
                folder: '/uploads/kentico'
            }
        ];

        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        if (response.data.uploaded_resources[0].new_url) {
            res.send(RESTRESPONSE(true, "File Uploaded Successfully", { new_url: response.data.uploaded_resources[0].new_url }));
        } else {
            res.status(500).send(RESTRESPONSE(false, "File upload failed"));
        }

    } catch (err) {
        res.status(500).send(RESTRESPONSE(false, err.message));
    }
};

module.exports = {
    uploadKenticoFileOnDuda
};
