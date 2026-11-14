const reservationService = require('../services/reservation.service');
const { successResponse } = require('../utils/response');

async function createReservation(req, res, next) {
  try {
    const reservation = await reservationService.createReservation({
      userId: req.user.id,
      showtimeId: req.body.showtimeId,
      seatIds: req.body.seatIds,
    });
    return successResponse(res, reservation, 201, 'Reservation confirmed successfully');
  } catch (error) {
    next(error);
  }
}

async function getMyReservations(req, res, next) {
  try {
    const reservations = await reservationService.getUserReservations(req.user.id);
    return successResponse(res, reservations, 200);
  } catch (error) {
    next(error);
  }
}

async function getReservationById(req, res, next) {
  try {
    const reservation = await reservationService.getReservationById(req.params.reservationId, req.user);
    return successResponse(res, reservation, 200);
  } catch (error) {
    next(error);
  }
}

async function cancelReservation(req, res, next) {
  try {
    const cancelled = await reservationService.cancelReservation(req.params.reservationId, req.user);
    return successResponse(res, cancelled, 200, 'Reservation cancelled successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReservation,
  getMyReservations,
  getReservationById,
  cancelReservation,
};

