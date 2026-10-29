package com.example.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

/**
 * Compression et redimensionnement automatiques des images à l'upload
 * (exigence non fonctionnelle : ne pas surcharger la bande passante).
 * S'appuie sur ImageIO (JDK) : aucune dépendance externe.
 */
@Service
public class ImageCompressionService {

    private static final int MAX_DIMENSION = 1600;   // px (côté le plus long)
    private static final float JPEG_QUALITY = 0.8f;  // 0..1

    /** Résultat : octets compressés + extension de sortie effective. */
    public record CompressedImage(byte[] data, String extension) {}

    /**
     * Redimensionne (si nécessaire) et recompresse l'image en JPEG.
     * Si le format n'est pas lisible par ImageIO (ex. webp sans plugin),
     * les octets d'origine sont conservés tels quels.
     */
    public CompressedImage compress(MultipartFile file, String originalExtension) throws IOException {
        byte[] original = file.getBytes();

        BufferedImage image = null;
        try {
            image = ImageIO.read(new ByteArrayInputStream(original));
        } catch (IOException ignored) {
            // format illisible -> fallback plus bas
        }
        if (image == null) {
            return new CompressedImage(original, originalExtension);
        }

        BufferedImage prepared = resizeIfNeeded(image);
        byte[] jpeg = toJpeg(prepared);

        // Si la recompression n'apporte rien (image déjà petite/optimisée), garder l'original.
        if (jpeg.length >= original.length && image.getWidth() <= MAX_DIMENSION
                && image.getHeight() <= MAX_DIMENSION) {
            return new CompressedImage(original, originalExtension);
        }
        return new CompressedImage(jpeg, "jpg");
    }

    private BufferedImage resizeIfNeeded(BufferedImage src) {
        int w = src.getWidth();
        int h = src.getHeight();
        if (w <= MAX_DIMENSION && h <= MAX_DIMENSION) {
            return toRgb(src);
        }
        double scale = (double) MAX_DIMENSION / Math.max(w, h);
        int nw = Math.max(1, (int) Math.round(w * scale));
        int nh = Math.max(1, (int) Math.round(h * scale));

        BufferedImage dst = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = dst.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(src, 0, 0, nw, nh, Color.WHITE, null);
        g.dispose();
        return dst;
    }

    /** Aplati la transparence sur fond blanc (JPEG ne gère pas l'alpha). */
    private BufferedImage toRgb(BufferedImage src) {
        if (src.getType() == BufferedImage.TYPE_INT_RGB) {
            return src;
        }
        BufferedImage rgb = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.drawImage(src, 0, 0, Color.WHITE, null);
        g.dispose();
        return rgb;
    }

    private byte[] toJpeg(BufferedImage image) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            ImageIO.write(image, "jpg", bos);
            return bos.toByteArray();
        }
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(JPEG_QUALITY);
        }
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(bos)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
        return bos.toByteArray();
    }
}
