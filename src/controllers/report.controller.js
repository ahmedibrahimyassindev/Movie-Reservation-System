const reportService = require('../services/report.service');
const { successResponse } = require('../utils/response');

async function getReservationSummary(req, res, next) {
  try {
    const summary = await reportService.getReservationSummary();
    return successResponse(res, summary, 200);
  } catch (error) {
    next(error);
  }
}

async function getShowtimeOccupancy(req, res, next) {
  try {
    const occupancy = await reportService.getShowtimeOccupancy(req.params.showtimeId);
    return successResponse(res, occupancy, 200);
  } catch (error) {
    next(error);
  }
}

async function getRevenueReport(req, res, next) {
  try {
    const report = await reportService.getRevenueReport(req.query);
    return successResponse(res, report, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReservationSummary,
  getShowtimeOccupancy,
  getRevenueReport,
};

