import {
  getTestimonialsService,
  createTestimonialService,
  updateTestimonialService,
  deleteTestimonialService,
} from "../services/testimonial.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { uploadToS3 } from "../middlewares/s3Upload.js";

export const getTestimonials =
  async (req, res) => {
    const data =
      await getTestimonialsService();

    res.json({
      success: true,
      data,
    });
  };

// export const createTestimonial =
export const createTestimonial = async (req, res) => {
  let avatar = "";

  if (req.file) {
    avatar = await uploadToS3(
      req.file,
      "testimonials"
    );
  }

  const testimonial =
    await createTestimonialService({
      student_name: req.body.student_name,
      role: req.body.role,
      testimonial_text: req.body.testimonial_text,
      rating: req.body.rating,
      avatar,
    });

  res.status(201).json({
    success: true,
    data: testimonial,
  });
};


export const updateTestimonial = async (req, res) => {
  let avatar = req.body.avatar || "";

  if (req.file) {
    avatar = await uploadToS3(
      req.file,
      "testimonials"
    );
  }

  await updateTestimonialService(
    req.params.id,
    {
      student_name: req.body.student_name,
      role: req.body.role,
      testimonial_text: req.body.testimonial_text,
      rating: req.body.rating,
      avatar,
    }
  );

  res.json({
    success: true,
    message: "Testimonial updated",
  });
};

export const deleteTestimonial = async (req, res) => {
  await deleteTestimonialService(req.params.id);

  res.json({
    success: true,
    message: "Testimonial deleted",
  });
};