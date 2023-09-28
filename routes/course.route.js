import express from 'express';
import { addLectureToCourseById, createCourse, deleteCourse, getAllCourses, getLecturesByCourseId, updateCourse } from '../controllers/course.controller.js';
import { authorizedRoles, authorizedSubscriber, isLoggedIn } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const router=express.Router();

router
.route('/')
.get(getAllCourses)
.post(isLoggedIn, authorizedRoles('ADMIN'), upload.single('thumbnail'), createCourse)

router
.route('/:id')
.get(isLoggedIn, authorizedSubscriber, getLecturesByCourseId)
.put(isLoggedIn, authorizedRoles('ADMIN'), updateCourse)
.delete(isLoggedIn, authorizedRoles('ADMIN'), deleteCourse)
.post(isLoggedIn, authorizedRoles('ADMIN'), upload.single('lecture'), addLectureToCourseById);


export default router;

