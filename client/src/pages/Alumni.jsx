import { useApp } from '../context/AppContext';
import DataTable from '../components/shared/DataTable';
import { GraduationCap } from 'lucide-react';

export default function Alumni() {
  const { alumni } = useApp();

  const columns = [
    { key: 'nis', label: 'NISN' },
    { key: 'name', label: 'Nama' },
    { key: 'class', label: 'Kelas Terakhir' },
    { key: 'graduationYear', label: 'Tahun Lulus' },
    {
      key: 'nextSchool',
      label: 'Sekolah Selanjutnya',
      render: (val) => val
        ? <span className="text-gray-700">{val}</span>
        : <span className="text-gray-400 italic">Belum diisi</span>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gold-50 text-gold-500">
            <GraduationCap size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary-800">Data Alumni</h2>
            <p className="text-sm text-gray-500">Daftar siswa yang telah lulus dari sekolah.</p>
          </div>
        </div>
      </div>

      <DataTable
        title="Alumni"
        columns={columns}
        data={alumni}
        onView={(row) => {
          alert(`Nama: ${row.name}\nNISN: ${row.nis}\nKelas: ${row.class}\nTahun Lulus: ${row.graduationYear}\nSekolah Selanjutnya: ${row.nextSchool || '-'}`);
        }}
      />
    </div>
  );
}
