import Foundation
import UIKit
import SDWebImage
import React

@objc(CustomImageViewIOS)
class CustomImageViewIOS: UIView {
  private let imageView = UIImageView()
  private var retryCount = 0
  private let maxRetryCount = 3

  @objc var source: NSDictionary? {
    didSet {
      loadImage()
    }
  }

  @objc var resizeMode: String = "cover" {
    didSet {
      switch resizeMode {
      case "contain":
        imageView.contentMode = .scaleAspectFit
      case "stretch":
        imageView.contentMode = .scaleToFill
      case "center":
        imageView.contentMode = .center
      default:
        imageView.contentMode = .scaleAspectFill
      }
    }
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
    setupImageView()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupImageView()
  }

  private func setupImageView() {
    imageView.clipsToBounds = true
    imageView.contentMode = .scaleAspectFill
    addSubview(imageView)

    imageView.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      imageView.topAnchor.constraint(equalTo: topAnchor),
      imageView.leftAnchor.constraint(equalTo: leftAnchor),
      imageView.rightAnchor.constraint(equalTo: rightAnchor),
      imageView.bottomAnchor.constraint(equalTo: bottomAnchor)
    ])
  }

  private func loadImage() {
    guard let source = source, 
          let uri = source["uri"] as? String,
          !uri.isEmpty else {
      imageView.image = nil
      return
    }

    if uri.hasPrefix("asset://") {
      let assetName = String(uri.dropFirst(8))
      if let image = UIImage(named: assetName) {
        imageView.image = image
      } else {
        print("Image not found: \(assetName)")
        imageView.image = nil
      }
    } else if let url = URL(string: uri) {
      imageView.sd_imageIndicator = SDWebImageActivityIndicator.gray
      imageView.sd_setImage(
        with: url,
        placeholderImage: nil,
        options: [.progressiveLoad, .refreshCached],
        completed: { [weak self] (image, error, cacheType, imageURL) in
          if let error = error {
            print("Failed to load image: \(error.localizedDescription)")
            self?.retryLoadImage()
          } else {
            self?.retryCount = 0
          }
        }
      )
    }
  }

  private func retryLoadImage() {
    if retryCount < maxRetryCount {
      retryCount += 1
      print("Retrying to load image, attempt \(retryCount)")
      DispatchQueue.main.async { [weak self] in
        self?.loadImage()
      }
    } else {
      print("Max retry attempts reached")
    }
  }
}
