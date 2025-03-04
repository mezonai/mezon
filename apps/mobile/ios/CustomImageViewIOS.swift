import Foundation
import UIKit
import SDWebImage
import React

@objc(CustomImageViewIOS)
class CustomImageViewIOS: UIView {
  private let imageView = UIImageView()

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

    // Make imageView fill the container view
    imageView.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      imageView.topAnchor.constraint(equalTo: topAnchor),
      imageView.leftAnchor.constraint(equalTo: leftAnchor),
      imageView.rightAnchor.constraint(equalTo: rightAnchor),
      imageView.bottomAnchor.constraint(equalTo: bottomAnchor)
    ])
  }

  private func loadImage() {
    guard let source = source, let uri = source["uri"] as? String else {
      imageView.image = nil
      return
    }

    if uri.hasPrefix("asset://") {
      // Handle local assets
      let assetName = String(uri.dropFirst(8))
      if let image = UIImage(named: assetName) {
        imageView.image = image
      } else {
        print("Image not found: \(assetName)")
        imageView.image = nil
      }
    } else if let url = URL(string: uri) {
      // Use SDWebImage for caching and loading remote images
      imageView.sd_imageIndicator = SDWebImageActivityIndicator.gray
      imageView.sd_setImage(
        with: url,
        placeholderImage: nil,
        options: [.progressiveLoad, .refreshCached],
        completed: nil
      )
    }
  }
}
