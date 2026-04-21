const Airtable = require("airtable");
const RESTRESPONSE = require("../../utils/RESTResponse");
const { get } = require("mongoose");
const dayjs = require("dayjs");
const { default: axios } = require("axios");

const TABLES = {
  RATINGS: "Clients-Rating",
  MASTER: "Client Master",
  SOURCES: "Review Sources",
  QUEUE: "Queue Manager",
};
const STATUS_LIST = [
  "Pending",
  "Queued",
  "Processing",
  "Failed",
  "Finished",
  "Cancelled",
  "Paused",
];

const airbase = new Airtable({
  apiKey: process.env.REVIEWBUILDER_AIRTABLE_API_KEY,
}).base(process.env.REVIEWBUILDER_BASE_AIRTABLE_ID);


const airtableClient = axios.create({
  baseURL: `https://api.airtable.com/v0/${process.env.REVIEWBUILDER_BASE_AIRTABLE_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.REVIEWBUILDER_AIRTABLE_API_KEY}`,
  },
});


function getDateFilter(filterType) {
  const now = dayjs();

  if (filterType === "current_month") {
    return {
      from: now.startOf("month").format("YYYY-MM-DD"),
      to: now.endOf("month").format("YYYY-MM-DD"),
    };
  }

  if (filterType === "last_week") {
    return {
      from: now.subtract(1, "week").startOf("week").format("YYYY-MM-DD"),
      to: now.subtract(1, "week").endOf("week").format("YYYY-MM-DD"),
    };
  }

  // Default: current_week
  return {
    from: now.startOf("week").format("YYYY-MM-DD"),
    to: now.endOf("week").format("YYYY-MM-DD"),
  };
}


const buildFilterFormula = ({ dudaId, status, filterType }) => {
  let conditions = [];

  if (dudaId) {
    conditions.push(`{Duda Id} = '${dudaId}'`);
  }

  if (status) {
    const safeStatus = status.replace(/'/g, "\\'");
    conditions.push(`{Status} = '${safeStatus}'`);
  }

  if (filterType) {
    const { from, to } = getDateFilter(filterType);

    conditions.push(
      `IS_AFTER({Created}, '${from}')`,
      `IS_BEFORE({Created}, '${to}')`
    );
  }

  return conditions.length ? `AND(${conditions.join(",")})` : "";
};

/* Create API:
Get by Duda Site ID
To fetch the queue: It Will work on filters  Current week and Before 7 days (default wil be current week)
. API to display the bar graph bring the total counts of the queue table based on Status: Pending, Queued, Processing,Failed,Finished,Cancelled,Paused
Airtable coumns are as follows:
Fields: 
		Client (Single line text)
		Duda Id (Single line text) 
		Submitted By (Single line text) Eg.xyz@gmail.com
		Source (Single line text) Eg.SMS Marketing Widget
		Source Type (Single select) 
				Options: None, Text, Email
		Sender (Single line text)
		Send To Number Or Email (Single line text)
		Message (Long text)
        Created (Created time)
		Status (Single select)
				Options: Pending, Queued, Processing,Failed,Finished,Cancelled,Paused
        Processing Message (Single line text)
        LastRun (last modified time)
*/

const getQueueSummaryBySiteId = async (req, res) => {
  try {
    const { dudaId } = req.params;
    const { filterType = "current_week" } = req.query;

    const { from, to } = getDateFilter(filterType);

    // const formula = `AND(
    //     {Duda Id} = '${dudaId}'
    //     DATETIME_FORMAT({Created}, 'YYYY-MM-DD') >= '${dayjs(from).format("YYYY-MM-DD")}',
    //     DATETIME_FORMAT({Created}, 'YYYY-MM-DD') <= '${dayjs(to).format("YYYY-MM-DD")}'
    // )`;
    const formula = `AND(
        {Duda Id} = '${dudaId}',
        DATETIME_FORMAT({Created}, 'YYYY-MM-DD') >= '${from}',
        DATETIME_FORMAT({Created}, 'YYYY-MM-DD') <= '${to}'
    )`;
    console.log("Record formula:", formula);
    const statusCounts = {};
    STATUS_LIST.forEach((s) => (statusCounts[s] = 0));

    await airbase(TABLES.QUEUE)
      .select({
        filterByFormula: formula,
      })
      .eachPage((records, fetchNextPage) => {
        console.log(records.length, "records fetched for site", dudaId);
        records.forEach((record) => {
          const status = record.get("Status");

          if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
          }
        });

        fetchNextPage();
      });

    res.json({
      success: true,
      data: statusCounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch summary",
      error: error.message,
    });
  }
};

/* Create An API to fetch queue records list by view name as status filter for a site ID */

const getQueueRecordsBySiteId = async (req, res) => {
  try {
    const { dudaId } = req.params;
    const {
      status,
      filterType = "current_week",
      pageSize = 10,
      offset,
    } = req.query;

    const formula = buildFilterFormula({ dudaId, status, filterType });

    const response = await airtableClient.get(`/${TABLES.QUEUE}`, {
      params: {
        pageSize: Number(pageSize),
        ...(offset && { offset }),
        ...(formula && { filterByFormula: formula }),
        sort: [
          {
            field: "Created",
            direction: "desc",
          },
        ],
      },
    });

    const { records, offset: nextOffset } = response.data;

    const formattedRecords = records.map((record) => ({
      id: record.id,
      client: record.fields["Client"],
      dudaId: record.fields["Duda Id"],
      submittedBy: record.fields["Submitted By"],
      source: record.fields["Source"],
      sourceType: record.fields["Source Type"],
      sender: record.fields["Sender"],
      receiver: record.fields["Send To Number Or Email"],
      message: record.fields["Message"],
      created: record.fields["Created"],
      status: record.fields["Status"],
      processingMessage: record.fields["Processing Message"],
      lastRun: record.fields["LastRun"],
    }));

    return res.json({
      success: true,
      count: formattedRecords.length,
      records: formattedRecords,
      nextOffset: nextOffset || null,
      hasMore: !!nextOffset,
    });
  } catch (error) {
    console.error("Pagination API Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch records",
      error: error.response?.data || error.message,
    });
  }
};






module.exports = {
  getQueueSummaryBySiteId,
  getQueueRecordsBySiteId,
};
