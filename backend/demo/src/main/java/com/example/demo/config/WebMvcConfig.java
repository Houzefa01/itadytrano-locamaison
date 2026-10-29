package com.example.demo.config;

import com.example.demo.model.enums.AmenityCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final String uploadDir;

    public WebMvcConfig(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public void addFormatters(FormatterRegistry registry) {
        // Les codes d'équipement transitent en minuscule (@JsonValue) dans les
        // paramètres de requête (ex. ?amenities=eau). Sans ce convertisseur, Spring
        // utilise Enum.valueOf() (nom majuscule) et rejette le filtre commodités en 400.
        registry.addConverter(String.class, AmenityCode.class,
                (String s) -> (s == null || s.isBlank()) ? null : AmenityCode.from(s));
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Sert les fichiers uploadés depuis un répertoire externe configurable
        // (et non plus depuis src/, qui est volatil au rebuild).
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + dir + "/");
    }
}
