import pandas as pd
import tkinter as tk
from tkinter import filedialog, messagebox
from tkinter import ttk
import os

class ExcelToCSVConverter:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("Excel 转 CSV 工具")
        self.window.geometry("600x400")
        
        # 设置样式
        style = ttk.Style()
        style.configure('TButton', padding=6)
        style.configure('TLabel', padding=6)

        # 创建主框架
        main_frame = ttk.Frame(self.window, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Excel文件选择
        ttk.Label(main_frame, text="1. 选择Excel文件：").grid(row=0, column=0, sticky=tk.W)
        self.excel_path_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.excel_path_var, width=50).grid(row=1, column=0, padx=5)
        ttk.Button(main_frame, text="浏览", command=self.select_excel).grid(row=1, column=1)

        # 工作表选择
        ttk.Label(main_frame, text="2. 选择工作表：").grid(row=2, column=0, sticky=tk.W, pady=(10,0))
        self.sheet_var = tk.StringVar()
        self.sheet_combo = ttk.Combobox(main_frame, textvariable=self.sheet_var, state='readonly')
        self.sheet_combo.grid(row=3, column=0, sticky=tk.W, padx=5)

        # 城市列选择
        ttk.Label(main_frame, text="3. 选择城市列：").grid(row=4, column=0, sticky=tk.W, pady=(10,0))
        self.city_column_var = tk.StringVar()
        self.city_combo = ttk.Combobox(main_frame, textvariable=self.city_column_var, state='readonly')
        self.city_combo.grid(row=5, column=0, sticky=tk.W, padx=5)

        # 转换按钮
        ttk.Button(main_frame, text="转换为CSV", command=self.convert_to_csv).grid(row=6, column=0, pady=20)

        # 状态标签
        self.status_var = tk.StringVar()
        ttk.Label(main_frame, textvariable=self.status_var).grid(row=7, column=0, columnspan=2)

        # 绑定事件
        self.sheet_combo.bind('<<ComboboxSelected>>', self.update_columns)

    def select_excel(self):
        file_path = filedialog.askopenfilename(
            filetypes=[("Excel files", "*.xlsx *.xls")]
        )
        if file_path:
            self.excel_path_var.set(file_path)
            self.update_sheets(file_path)

    def update_sheets(self, file_path):
        try:
            excel_file = pd.ExcelFile(file_path)
            self.sheet_combo['values'] = excel_file.sheet_names
            if excel_file.sheet_names:
                self.sheet_combo.set(excel_file.sheet_names[0])
                self.update_columns(None)
        except Exception as e:
            messagebox.showerror("错误", f"读取Excel文件失败：{str(e)}")

    def update_columns(self, event):
        try:
            df = pd.read_excel(self.excel_path_var.get(), sheet_name=self.sheet_var.get())
            self.city_combo['values'] = list(df.columns)
            if list(df.columns):
                self.city_combo.set(list(df.columns)[0])
        except Exception as e:
            messagebox.showerror("错误", f"读取工作表失败：{str(e)}")

    def convert_to_csv(self):
        try:
            # 读取Excel文件
            df = pd.read_excel(
                self.excel_path_var.get(),
                sheet_name=self.sheet_var.get()
            )

            # 重命名选定的列为'城市'
            city_column = self.city_column_var.get()
            if city_column != '城市':
                df = df.rename(columns={city_column: '城市'})

            # 选择保存位置
            save_path = filedialog.asksaveasfilename(
                defaultextension=".csv",
                filetypes=[("CSV files", "*.csv")],
                initialfile="converted_data.csv"
            )

            if save_path:
                # 保存为CSV，确保使用UTF-8编码
                df.to_csv(save_path, index=False, encoding='utf-8')
                self.status_var.set(f"转换成功！文件已保存至：{save_path}")
                messagebox.showinfo("成功", "转换完成！")
            
        except Exception as e:
            messagebox.showerror("错误", f"转换失败：{str(e)}")

    def run(self):
        self.window.mainloop()

if __name__ == "__main__":
    app = ExcelToCSVConverter()
    app.run()