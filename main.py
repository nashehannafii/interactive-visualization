import os
import json
import zipfile
from pathlib import Path

def get_folder_version(folder_path):
    """
    Mencoba membaca versi dari manifest.json di dalam folder.
    Jika tidak ditemukan atau error, default ke v1.0.0.
    """
    manifest_path = folder_path / "manifest.json"
    if manifest_path.exists():
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                version = data.get("version")
                if version:
                    return f"v{version.lstrip('v')}"
        except Exception:
            pass
    return "v1.0.0"

def compress_folder(folder_path, output_dir):
    """
    Mengompres isi folder ke file zip dengan penamaan: <folder-name>-<version>.zip.
    Jika ada versi terdahulu di folder output, versi lama akan dipindahkan ke output/archive/.
    """
    version = get_folder_version(folder_path)
    zip_filename = f"{folder_path.name}-{version}.zip"
    output_path = output_dir / zip_filename
    archive_dir = output_dir / "archive"

    # Buat direktori output dan archive jika belum ada
    output_dir.mkdir(parents=True, exist_ok=True)
    archive_dir.mkdir(parents=True, exist_ok=True)

    # Pindahkan versi lama dari output ke output/archive
    prefix = f"{folder_path.name}-"
    for existing_file in output_dir.glob(f"{prefix}*.zip"):
        if existing_file.name != zip_filename:
            target_archive_path = archive_dir / existing_file.name
            existing_file.rename(target_archive_path)
            print(f"📦 Versi lama [{existing_file.name}] dipindahkan ke archive/")

    file_count = 0
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            # Abaikan folder/file tersembunyi
            files = [f for f in files if not f.startswith('.')]
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                file_full_path = Path(root) / file
                arcname = file_full_path.relative_to(folder_path)
                zipf.write(file_full_path, arcname)
                file_count += 1

    return zip_filename, file_count, output_path

def main():
    base_dir = Path(__file__).parent.resolve()
    output_dir = base_dir / "output"

    print("=" * 60)
    print("      CLI INTERAKTIF COMPRESSOR FOLDER MATERI")
    print("=" * 60)
    print(f"Direktori Kerja: {base_dir}")
    print(f"Direktori Output: {output_dir}\n")

    # Cari semua subfolder yang mengandung file/materi (mengabaikan folder output, archive & folder tersembunyi)
    ignored_names = {"output", "archive"}
    folders = [
        d for d in base_dir.iterdir()
        if d.is_dir() and not d.name.startswith('.') and d.name not in ignored_names
    ]

    if not sorted(folders):
        print("❌ Tidak ditemukan folder materi di direktori saat ini.")
        return

    folders.sort(key=lambda x: x.name)

    print("Daftar Folder Materi yang Tersedia:")
    for idx, folder in enumerate(folders, 1):
        version = get_folder_version(folder)
        print(f"  [{idx}] {folder.name} (Versi: {version})")
    print(f"  [A] Compress SEMUA folder ({len(folders)} folder)")
    print("  [Q] Keluar\n")

    choice = input("Pilih nomor folder (1, 2, ...), 'A' untuk semua, atau 'Q' untuk keluar: ").strip().upper()

    if choice == 'Q':
        print("\nProses dibatalkan. Sampai jumpa!")
        return

    selected_folders = []
    if choice == 'A':
        selected_folders = folders
    elif choice.isdigit() and 1 <= int(choice) <= len(folders):
        selected_folders = [folders[int(choice) - 1]]
    else:
        print("\n❌ Pilihan tidak valid.")
        return

    print("\n" + "-" * 60)
    print("Memproses kompresi...")
    print("-" * 60)

    results = []
    for folder in selected_folders:
        zip_name, count, out_file = compress_folder(folder, output_dir)
        results.append((folder.name, zip_name, count, out_file))
        print(f"✅ [{folder.name}] Berhasil dikompres → {zip_name} ({count} file)")

    print("\n" + "=" * 60)
    print("✨ Selesai! Seluruh file zip tersimpan di folder 'output/':")
    for orig, zip_name, count, out_file in results:
        print(f"  • output/{zip_name}")
    print("=" * 60)

if __name__ == "__main__":
    main()
