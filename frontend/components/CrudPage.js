"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/tables/DataTable";
import FormModal from "@/components/ui/FormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

/**
 * Generic CRUD page that can power all master modules.
 * 
 * Props:
 *  - title, description: Page header text
 *  - service: { getAll, create, update, delete } 
 *  - columns: TanStack Table column definitions (without Actions)
 *  - FormComponent: A form component that receives { data, onSubmit, isLoading }
 *  - searchPlaceholder: string
 *  - modalSize: 'sm' | 'md' | 'lg'
 */
export default function CrudPage({
  title,
  description,
  service,
  columns,
  FormComponent,
  searchPlaceholder = "Search...",
  modalSize = "md",
  extraActions = null,
}) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Fetch data
  const fetchData = useCallback(
    async (p = page, s = search) => {
      setLoading(true);
      try {
        const res = await service.getAll({ page: p, limit: pageSize, search: s });
        setRecords(res.data.data);
        setTotal(res.data.pagination?.total || 0);
      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [service, page, pageSize, search]
  );

  // Load on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when page changes
  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchData(newPage, search);
  };

  // Re-fetch when search changes
  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    fetchData(1, val);
  };

  // Open add modal
  const handleAdd = () => {
    setEditRecord(null);
    setModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (record) => {
    setEditRecord(record);
    setModalOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  // Submit form (create or update)
  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editRecord) {
        await service.update(editRecord._id, data);
        toast.success("Updated successfully!");
      } else {
        await service.create(data);
        toast.success("Created successfully!");
      }
      setModalOpen(false);
      fetchData(page, search);
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed";
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await service.delete(deleteId);
      toast.success("Deleted successfully!");
      setDeleteOpen(false);
      fetchData(page, search);
    } catch (err) {
      toast.error("Failed to delete record");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Action column
  const actionColumn = {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {extraActions && extraActions(row)}
        <button
          onClick={() => handleEdit(row.original)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleDeleteClick(row.original._id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
  };

  const tableColumns = [...columns, actionColumn];

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add {title.replace(" Management", "").trim()}
          </button>
        }
      />

      <div className="glass-card rounded-2xl p-5">
        <DataTable
          columns={tableColumns}
          data={records}
          loading={loading}
          totalRows={total}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          searchPlaceholder={searchPlaceholder}
        />
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRecord ? `Edit ${title.replace(" Management", "")}` : `Add ${title.replace(" Management", "")}`}
        size={modalSize}
      >
        <FormComponent
          data={editRecord}
          onSubmit={handleFormSubmit}
          isLoading={formLoading}
          onCancel={() => setModalOpen(false)}
        />
      </FormModal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
