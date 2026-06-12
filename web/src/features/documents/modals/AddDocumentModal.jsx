import React, { useState, useEffect } from "react";
import { Select, Field, Modal, DatePicker } from '@components/ui';
import { parseExcelFile } from '@utils/excelUtils';
import Swal from "sweetalert2";

const CATEGORIES = [
  "Identity",
  "Registration",
  "Insurance",
  "Legal",
  "Financial",
  "Other",
];

const ENTITY_TYPES = ["Employee", "Vehicle", "Company"];

export default function AddDocumentModal({
  isOpen,
  onClose,
  onSubmit,
  documentToEdit,
  initialTab,
}) {
  const defaultForm = {
    title: "",
    entityType: initialTab || "Employee",
    entityName: "",
    category: "Identity",
    status: "Valid",
    expiryDate: new Date(
      new Date().setFullYear(new Date().getFullYear() + 1)
    )
      .toISOString()
      .split("T")[0],
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (documentToEdit) {
      setFormData(documentToEdit);
    } else {
      setFormData({
        ...defaultForm,
        entityType: initialTab || "Employee",
      });
    }
  }, [documentToEdit, isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

    onSubmit(formData);
    onClose();
  };



  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      const data = await parseExcelFile(file);

      if (data?.length > 0) {
        const row = data[0];

        setFormData((prev) => ({
          ...prev,
          title:
            row.Title ||
            row.title ||
            row.DocumentTitle ||
            prev.title,

          entityType:
            row.EntityType ||
            row.entityType ||
            row.Type ||
            prev.entityType,

          entityName:
            row.EntityName ||
            row.entityName ||
            row.Name ||
            prev.entityName,

          category:
            row.Category ||
            row.category ||
            prev.category,

          status:
            row.Status ||
            row.status ||
            "Valid",

          expiryDate:
            row.ExpiryDate ||
            row.expiryDate ||
            row.Date ||
            prev.expiryDate,
        }));

        Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: "Data Imported",
          text: "Document details filled from Excel",
          toast: true,
          timer: 2000,
          position: "top-end",
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Import Failed",
        text: "Failed to parse Excel file",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentToEdit ? "Edit Document" : "Upload Document"}
      subtitle="Records"
      onSubmit={handleSubmit}
      submitLabel={documentToEdit ? "Update Document" : "Save Document"}
      cancelLabel="Cancel"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-6">
        <Field
          label="Document Title"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          placeholder="Driving License"
          labelClassName="text-xs font-bold text-gray-500 uppercase block mb-0"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Entity Type
            </label>
            <Select
              variant="form"
              value={formData.entityType}
              onChange={(val) =>
                handleChange({
                  target: {
                    name: "entityType",
                    value: val,
                  },
                })
              }
              options={ENTITY_TYPES.map((i) => ({
                value: i,
                label: i,
              }))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Category
            </label>
            <Select
              variant="form"
              value={formData.category}
              onChange={(val) =>
                handleChange({
                  target: {
                    name: "category",
                    value: val,
                  },
                })
              }
              options={CATEGORIES.map((i) => ({
                value: i,
                label: i,
              }))}
            />
          </div>
        </div>

        <Field
          label="Related Name / ID"
          name="entityName"
          required
          value={formData.entityName}
          onChange={handleChange}
          labelClassName="text-xs font-bold text-gray-500 uppercase block mb-0"
        />

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
            Status
          </label>
          <Select
            variant="form"
            value={formData.status}
            onChange={(val) =>
              handleChange({
                target: {
                  name: "status",
                  value: val,
                },
              })
            }
            options={[
              { value: "Valid", label: "Valid" },
              { value: "Expiring Soon", label: "Expiring Soon" },
              { value: "Expired", label: "Expired" },
            ]}
          />
        </div>

        <DatePicker
          label="Expiry Date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          labelClassName="text-xs font-bold text-gray-500 uppercase block mb-0"
        />

        <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-purple-500 cursor-pointer">
          <p className="font-medium">
            Click to upload file
          </p>
          <p className="text-xs text-gray-500">
            PDF, JPG, PNG (Max 5MB)
          </p>
        </div>
      </div>
    </Modal>
  );
}