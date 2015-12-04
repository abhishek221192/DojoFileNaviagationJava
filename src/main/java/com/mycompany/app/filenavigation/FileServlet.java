/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.mycompany.app.filenavigation;

import com.google.gson.Gson;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 *
 * @author abhisheksingh
 */
@WebServlet(name = "FileServlet", urlPatterns = {"/FileServlet"})
public class FileServlet extends HttpServlet {
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String fileId = request.getParameter("fileId");
        if (fileId == null) {
            File file = new File("C:\\Users\\abhisheksingh\\Desktop\\Type");
            
            FileDetail fileDetail = new FileDetail();
            fileDetail.setId(file.getPath());
            fileDetail.setName(file.getName());
            fileDetail.setSize(file.getTotalSpace());
            fileDetail.setMod(new Date());
            fileDetail.setDir(file.isDirectory());
            
            String json = new Gson().toJson(fileDetail);
            response.getWriter().println(json);
            
        } else {
            
            File[] files = new File(fileId).listFiles();
            List<FileDetail> fileList = new ArrayList<FileDetail>();
            
            for (File file : files) {
                
                FileDetail fileDetail = new FileDetail();
                fileDetail.setId(file.getPath());
                fileDetail.setName(file.getName());
                fileDetail.setSize(file.getTotalSpace());
                fileDetail.setMod(new Date());
                fileDetail.setDir(file.isDirectory());
                fileDetail.setParId(file.getParent());
                
                fileList.add(fileDetail);
            }
            
            String json = new Gson().toJson(fileList);
            
            response.getWriter().println(json);
        }
        
    }
    
}
