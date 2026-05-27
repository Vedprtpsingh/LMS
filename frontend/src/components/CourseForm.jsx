import React, { useEffect, useState } from "react";

const DEFAULT_VALUES = {
  title: "",
  description: "",
  category: "General",
  level: "Beginner",
  language: "English",
  thumbnailUrl: "",
  tags: "",
  videoUrls: "",
  pdfUrls: "",
};

function CourseForm({ onClose, onSubmit, initialValues }) {
  const convertInitialValues = (values) => ({
    ...DEFAULT_VALUES,
    ...values,
    tags: Array.isArray(values?.tags) ? values.tags.join(",") : values?.tags || "",
    videoUrls: Array.isArray(values?.videoUrls) ? values.videoUrls.join(",") : values?.videoUrls || "",
    pdfUrls: Array.isArray(values?.pdfUrls) ? values.pdfUrls.join(",") : values?.pdfUrls || "",
  });

  const [values, setValues] = useState(convertInitialValues(initialValues));

  useEffect(() => {
    setValues(convertInitialValues(initialValues));
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...values,
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      videoUrls: values.videoUrls.split(",").map((url) => url.trim()).filter(Boolean),
      pdfUrls: values.pdfUrls.split(",").map((url) => url.trim()).filter(Boolean),
    });
    setValues(DEFAULT_VALUES);
  };

  const isEdit = Boolean(initialValues?.id);

  return (
    <div className="modal d-block fade show" tabIndex="-1" role="dialog">
      <div className="modal-backdrop fade show"></div>
      <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
        <div className="modal-content shadow-lg rounded-4">
          <div className="modal-header">
            <h5 className="modal-title">{isEdit ? "Update Course" : "Create New Course Draft"}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Course title</label>
                  <input name="title" value={values.title} onChange={handleChange} className="form-control" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Category</label>
                  <input name="category" value={values.category} onChange={handleChange} className="form-control" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Level</label>
                  <select name="level" value={values.level} onChange={handleChange} className="form-select">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Language</label>
                  <input name="language" value={values.language} onChange={handleChange} className="form-control" />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea name="description" value={values.description} onChange={handleChange} className="form-control" rows="4" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Thumbnail URL</label>
                  <input name="thumbnailUrl" value={values.thumbnailUrl} onChange={handleChange} className="form-control" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Tags</label>
                  <input name="tags" value={values.tags} onChange={handleChange} className="form-control" placeholder="enter,present,beginner" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Video URLs</label>
                  <input name="videoUrls" value={values.videoUrls} onChange={handleChange} className="form-control" placeholder="https://... , https://..." />
                </div>
                <div className="col-md-6">
                  <label className="form-label">PDF URLs</label>
                  <input name="pdfUrls" value={values.pdfUrls} onChange={handleChange} className="form-control" placeholder="https://... , https://..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">{isEdit ? "Save changes" : "Create Draft"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CourseForm;
